require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/profile', async (req, res) => {
  const { username, links, timezone } = req.body;
  if (!links || links.length === 0) {
    return res.status(400).json({ error: 'At least one link required' });
  }

  // Mock profile for now (you'll replace with real logic later)
  const profile = {
    username: username || 'unknown',
    joinDate: 'March 2023',
    peakHour: 4,
    peakPeriod: 'Late Night/Early Morning',
    repostCount: links.length,
    personality: 'Emotional Guard',
    defenseMechanisms: ['Sarcasm', 'Intellectualization'],
    attachmentStyle: 'Fearful-Avoidant',
    riskFlags: ['Isolation', 'Self-deprecation'],
    recommendations: ['Reach out between 6PM–9PM', 'Lead with curiosity'],
    confidenceScore: 91
  };

  res.json({ profile });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ShadowProfile running on port ${PORT}`));
