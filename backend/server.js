require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tiktokScraper = require('tiktok-scraper');
const moment = require('moment-timezone');
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/profile', async (req, res) => {
  const { username, links, timezone = 'Africa/Lagos' } = req.body;

  try {
    let reposts = [];

    // Scrape from username
    if (username) {
      const user = await tiktokScraper.getUserProfileInfo(username);
      const posts = await tiktokScraper.user(username, { number: 50 });
      reposts = posts.collector.map(p => ({
        caption: p.text || '',
        hashtags: p.hashtags || [],
        audio: p.musicMeta?.musicName || '',
        timestamp: p.createTime || Date.now(),
        likes: p.diggCount || 0,
        comments: p.commentCount || 0
      }));
    }

    // Scrape from links
    if (links && links.length > 0) {
      for (const link of links) {
        const video = await tiktokScraper.getVideoMeta(link);
        reposts.push({
          caption: video?.collector?.[0]?.text || '',
          hashtags: video?.collector?.[0]?.hashtags || [],
          audio: video?.collector?.[0]?.musicMeta?.musicName || '',
          timestamp: video?.collector?.[0]?.createTime || Date.now(),
          likes: video?.collector?.[0]?.diggCount || 0,
          comments: video?.collector?.[0]?.commentCount || 0
        });
      }
    }

    // --- Psychology Engine ---
    const analyzeSentiment = (text) => {
      const sad = ['lonely', 'cry', 'hurt', 'break', 'sad', 'pain', 'betrayal'];
      const angry = ['hate', 'fuck', 'angry', 'mad', 'revenge'];
      const happy = ['love', 'happy', 'excited', 'blessed', 'grateful'];
      let score = 0;
      if (sad.some(w => text.toLowerCase().includes(w))) score -= 2;
      if (angry.some(w => text.toLowerCase().includes(w))) score -= 1;
      if (happy.some(w => text.toLowerCase().includes(w))) score += 2;
      return score;
    };

    const detectTheme = (caption, hashtags) => {
      const allText = (caption + ' ' + hashtags.join(' ')).toLowerCase();
      if (allText.includes('love') || allText.includes('romance')) return 'romance';
      if (allText.includes('break') || allText.includes('ex')) return 'heartbreak';
      if (allText.includes('funny') || allText.includes('meme')) return 'humor';
      if (allText.includes('angry') || allText.includes('toxic')) return 'anger';
      return 'neutral';
    };

    // Activity analysis
    const hourCount = Array(24).fill(0);
    reposts.forEach(r => {
      const local = moment.utc(r.timestamp).tz(timezone);
      hourCount[local.hour()]++;
    });

    const peakHour = hourCount.indexOf(Math.max(...hourCount));
    const peakPeriod = peakHour >= 0 && peakHour < 6 ? 'Late Night/Early Morning' :
                      peakHour >= 6 && peakHour < 12 ? 'Morning' :
                      peakHour >= 12 && peakHour < 18 ? 'Afternoon' : 'Evening';

    // Profile generation
    const total = reposts.length;
    const avgSentiment = reposts.reduce((sum, r) => sum + analyzeSentiment(r.caption), 0) / total;
    const themes = reposts.map(r => detectTheme(r.caption, r.hashtags));
    const themeCount = themes.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});

    const personality = avgSentiment < -1 ? 'Emotional Guard' :
                       avgSentiment > 1 ? 'Expressive Romantic' : 'Balanced Observer';

    const defenses = avgSentiment < 0 ? ['Sarcasm', 'Avoidance'] : ['Humor', 'Intellectualization'];
    const attachment = avgSentiment < -1 ? 'Fearful-Avoidant' : 'Anxious-Attached';

    const riskFlags = [];
    if (themeCount['heartbreak'] > 2) riskFlags.push('Recent heartbreak');
    if (peakHour >= 0 && peakHour < 6) riskFlags.push('Night owl — possible isolation');
    if (themeCount['anger'] > 1) riskFlags.push('Unexpressed anger');

    const profile = {
      username: username || 'anonymous',
      joinDate: 'Scraped from profile',
      peakHour,
      peakPeriod,
      repostCount: total,
      sentimentScore: avgSentiment.toFixed(2),
      themeBreakdown: themeCount,
      personality,
      defenseMechanisms: defenses,
      attachmentStyle: attachment,
      riskFlags: riskFlags.length ? riskFlags : ['None detected'],
      recommendations: [
        peakHour >= 0 && peakHour < 6 ? 'Avoid reaching out during peak hours (4 AM)' : 'Reach out during evening hours',
        'Lead with curiosity, not validation',
        'Be consistent, not intense'
      ],
      confidenceScore: Math.min(95, 70 + total)
    };

    res.json({ profile });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scraping failed. Try a valid TikTok username or link.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ShadowProfile running on port ${PORT}`));
