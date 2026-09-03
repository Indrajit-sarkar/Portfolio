const axios = require('axios');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('[TTS] Missing ELEVENLABS_API_KEY');
    return res.status(500).json({ error: 'TTS not configured' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Missing text' });
  }

  // Limit text to 500 chars to conserve free tier quota (10K chars/month)
  const trimmed = text.slice(0, 500);

  // Voice: "Rachel" — warm, professional female voice (built-in, free tier)
  const voiceId = '21m00Tcm4TlvDq8ikWAM';  // Rachel
  const modelId = 'eleven_flash_v2_5';  // fastest, cheapest, works on free tier

  try {
    console.log(`[TTS] Synthesizing ${trimmed.length} chars with ElevenLabs`);

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
      {
        text: trimmed,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(Buffer.from(response.data));

  } catch (error) {
    const status = error.response?.status || 500;
    const errData = error.response?.data
      ? Buffer.from(error.response.data).toString('utf-8').slice(0, 500)
      : error.message;
    console.error(`[TTS] Error ${status}:`, errData);
    return res.status(status).json({ error: 'TTS synthesis failed' });
  }
};
