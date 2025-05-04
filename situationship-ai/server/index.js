import express from 'express';
import multer from 'multer';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import config from './config.js'; // Note: need to rename config.js to include .js extension

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 10 // Max 10 files
    }
});

// Initialize OpenAI
const openai = new OpenAI({
    // im deploying on cloudflare so I need to use the environment variable OPENAI_API_KEY on there
    apiKey: config.OPENAI_API_KEY
});

// Configure concurrency limit (adjust based on your OpenAI rate limits)
const limit = pLimit(3); // Process 3 requests concurrently

app.use(cors());
app.use(express.json());

// Helper function to chunk array into smaller groups
const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

const ANALYSIS_TEMPLATE = `Please analyze these conversation screenshots and provide a detailed relationship analysis, including an objective judgment on who was more in the wrong. 
Format your response EXACTLY as follows:

### Relationship Analysis

Communication Patterns:
- [Analyze directness, tone, and communication style of each person]
- [Note any patterns in how they express themselves]
- [Identify specific communication behaviors with examples]

Emotional Undertones:
- [Identify emotional states and reactions]
- [Note any defensive or dismissive behavior]
- [Analyze emotional intelligence and awareness]

Potential Red Flags:
- [List any concerning patterns or behaviors]
- [Identify boundary issues or mismatches]
- [Note communication or emotional misalignments]

Potential Green Flags:
- [List positive aspects of the interaction]
- [Note healthy communication patterns]
- [Identify growth potential]

Overall Dynamics:
- [Provide overall assessment of relationship potential]
- [Suggest areas for improvement or growth]
- [Give balanced perspective on compatibility]

Objective Judgment:
- Who was more in the wrong: [State which person was more at fault and why]
- What could have been done better: [Provide specific suggestions for both parties]
- Key misunderstandings: [Identify critical points where communication broke down]

TL;DR:
[Write a single, clear sentence that captures the essence of the situation and indicates who was more in the wrong.]`;

// Process a single chunk of images
const processImageChunk = async (images) => {
    const content = [
        { 
            type: "text", 
            text: ANALYSIS_TEMPLATE
        }
    ];

    images.forEach(file => {
        const base64Image = file.buffer.toString('base64');
        content.push({
            type: "image_url",
            image_url: {
                url: `data:${file.mimetype};base64,${base64Image}`
            }
        });
    });

    const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
            {
                role: "system",
                content: `You are an expert relationship analyst specializing in digital communication patterns.
                         Your task is to:
                         1. Analyze the conversation objectively
                         2. Determine who was more in the wrong
                         3. Provide constructive feedback for both parties
                         4. Be direct but fair in your assessment
                         5. Support your judgment with specific examples from the conversation
                         
                         You MUST follow the exact formatting provided in the prompt.
                         Your analysis should be detailed, insightful, and maintain consistent markdown formatting.
                         Be particularly clear in the Objective Judgment section about who was more at fault and why.`
            },
            {
                role: "user",
                content: content
            }
        ],
        max_tokens: 1500,
        temperature: 0.7
    });

    return response.choices[0].message.content;
};

// Update the combination prompt
const combineAnalyses = async (analysisResults) => {
    const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
            {
                role: "system",
                content: `Combine multiple relationship analyses into a single coherent summary.
                         You MUST maintain the exact format:

                         ### Relationship Analysis

                         Communication Patterns:
                         - [points]

                         Emotional Undertones:
                         - [points]

                         Potential Red Flags:
                         - [points]

                         Potential Green Flags:
                         - [points]

                         Overall Dynamics:
                         - [points]

                         TL;DR:
                         [brief summary]

                         Ensure consistent formatting and maintain the style of the original analyses.`
            },
            {
                role: "user",
                content: `Combine these analyses into one coherent summary, maintaining the exact formatting structure shown above:\n\n${analysisResults.join('\n\n')}`
            }
        ],
        max_tokens: 1500,
        temperature: 0.7
    });

    return response.choices[0].message.content;
};

// Endpoint to analyze images
app.post('/api/analyze', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        const imageChunks = chunkArray(req.files, 2);
        const analysisPromises = imageChunks.map(chunk => 
            limit(() => processImageChunk(chunk))
        );

        const analysisResults = await Promise.all(analysisPromises);
        const combinedAnalysis = await combineAnalyses(analysisResults);

        res.json({
            success: true,
            analysis: combinedAnalysis
        });

    } catch (error) {
        console.error('Error processing images:', error);
        res.status(500).json({
            success: false,
            error: 'Error processing images',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: err.message
    });
});

const PORT = config.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 