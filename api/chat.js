// api/chat.js - Vercel Serverless Function
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, threadId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create a thread if one doesn't exist
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Run failed with status: ${runStatus.status}`);
      }
    }

    // Get the assistant's messages
    const messages = await openai.beta.threads.messages.list(currentThreadId);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant' && msg.run_id === run.id);

    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    // Extract and clean text content, removing annotations
    let responseText = '';
    
    for (const content of assistantMessage.content) {
      if (content.type === 'text') {
        let text = content.text.value;
        
        // Remove annotations using the annotation indices
        if (content.text.annotations && content.text.annotations.length > 0) {
          // Sort annotations by start_index in descending order to avoid index shifting
          const sortedAnnotations = [...content.text.annotations].sort((a, b) => b.start_index - a.start_index);
          
          // Remove each annotation from the text
          for (const annotation of sortedAnnotations) {
            text = text.substring(0, annotation.start_index) + text.substring(annotation.end_index);
          }
        }
        
        responseText += text;
      }
    }

// Enhanced citation removal function
function removeCitations(text) {
  return text
    // Remove Unicode citation brackets 【source】
    .replace(/【\d+:\d+†source】/g, '')
    .replace(/【[^】]*】/g, '')
    
    // Remove various bracket citation formats
    .replace(/\[\d+\]/g, '')
    .replace(/\[citation:\d+\]/g, '')
    .replace(/\[\d+:\d+†[^\]]+\]/g, '')
    
    // Remove Unicode variants
    .replace(/\u3010\d+:\d+\u2020[^\u3011]+\u3011/g, '')
    
    // Remove any remaining citation-like patterns
    .replace(/\[\s*\d+\s*:\s*\d+\s*[^\]]*\]/g, '')
    
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// In your handler function, replace the citation cleanup section:

// Extract and clean text content, removing annotations
let responseText = '';

for (const content of assistantMessage.content) {
  if (content.type === 'text') {
    let text = content.text.value;
    
    // Remove annotations using the annotation indices
    if (content.text.annotations && content.text.annotations.length > 0) {
      // Sort annotations by start_index in descending order
      const sortedAnnotations = [...content.text.annotations].sort(
        (a, b) => b.start_index - a.start_index
      );
      
      // Remove each annotation from the text
      for (const annotation of sortedAnnotations) {
        text = text.substring(0, annotation.start_index) + 
               text.substring(annotation.end_index);
      }
    }
    
    responseText += text;
  }
}

// Apply comprehensive citation removal
responseText = removeCitations(responseText);

return res.status(200).json({
  response: responseText,
  threadId: currentThreadId
});
