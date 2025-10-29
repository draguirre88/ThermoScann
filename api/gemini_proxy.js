// Este es un Vercel Serverless Function (Node.js) que maneja la clave de forma segura.
// Se ejecutará en un servidor privado, no en el navegador de tu paciente.

// La clave de API DEBE establecerse como una variable de entorno SECRETA en Vercel,
// NO en este código. (Ej: GEMINI_API_KEY)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

module.exports = async (req, res) => {
    // Solo acepta peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server Error: Gemini API Key not configured on the server.' });
    }

    try {
        const { base64Image, systemPrompt, userQuery } = req.body;

        if (!base64Image) {
            return res.status(400).json({ error: 'Missing image data.' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: userQuery },
                        {
                            inlineData: {
                                mimeType: "image/png",
                                data: base64Image
                            }
                        }
                    ]
                }
            ],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            // Reenvía errores de Google
            return res.status(response.status).json({ 
                error: 'Gemini API Error',
                details: data.error ? data.error.message : 'Unknown API error'
            });
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo obtener el análisis de la IA.';
        
        res.status(200).json({ analysis: resultText });

    } catch (error) {
        console.error('Proxy processing error:', error);
        res.status(500).json({ error: 'Internal server error processing the image.' });
    }
};
