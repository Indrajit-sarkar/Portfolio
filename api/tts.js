module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Use the same Groq API key already set for LLM
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    console.error('[TTS] Missing LLM_API_KEY');
    return res.status(500).json({ error: 'TTS not configured' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Missing text' });
  }

  // Limit text to 500 chars
  const trimmed = text.slice(0, 500);

  try {
    console.log(`[TTS] Groq Orpheus: synthesizing ${trimmed.length} chars`);

    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'canopylabs/orpheus-v1-english',
        input: trimmed,
        voice: 'hannah',
        response_format: 'wav'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TTS] Groq error ${response.status}:`, errText.slice(0, 300));
      return res.status(response.status).json({
        error: 'TTS synthesis failed',
        status: response.status,
        detail: errText.slice(0, 200)
      });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`[TTS] Success: ${audioBuffer.byteLength} bytes`);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(audioBuffer);

  } catch (error) {
    console.error('[TTS] Error:', error.message);
    return res.status(500).json({ error: 'TTS synthesis failed', detail: error.message });
  }
};
