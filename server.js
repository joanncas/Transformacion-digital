const express = require('express');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const SecureOpenAI = require('./SecureOpenAI');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(express.json());

// MongoDB connection string
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dataprivacyvault';
let db;

// Connect to MongoDB
async function connectToDatabase() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    // Create a unique index on the token field
    await db.collection('tokens').createIndex({ token: 1 }, { unique: true });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Function to generate a token
function generateToken(input, prefix) {
  const hash = crypto.createHash('md5').update(input).digest('hex').slice(0, 8);
  return `${prefix}_${hash}`;
}

// Function to anonymize a single piece of information
async function anonymizeInfo(info, prefix) {
  const existingToken = await db.collection('tokens').findOne({ originalValue: info });
  if (existingToken) {
    return existingToken.token;
  }
  const token = generateToken(info, prefix);
  await db.collection('tokens').insertOne({ token, originalValue: info });
  return token;
}

// Function to anonymize the entire message
async function anonymizeMessage(message) {
  // Regex patterns for name, email, and phone number
  const namePattern = /[A-Z][a-z]+ [A-Z][a-z]+/g;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /\b\d{10}\b/g;

  // Anonymize names
  message = await replaceAsync(message, namePattern, async (match) => await anonymizeInfo(match, 'NAME'));

  // Anonymize emails
  message = await replaceAsync(message, emailPattern, async (match) => await anonymizeInfo(match, 'EMAIL'));

  // Anonymize phone numbers
  message = await replaceAsync(message, phonePattern, async (match) => await anonymizeInfo(match, 'PHONE'));

  return message;
}

// Helper function for async replace
async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

// Function to deanonymize the message
async function deanonymizeMessage(anonymizedMessage) {
  const tokenPattern = /(NAME|EMAIL|PHONE)_[a-f0-9]{8}/g;
  
  return await replaceAsync(anonymizedMessage, tokenPattern, async (match) => {
    const result = await db.collection('tokens').findOne({ token: match });
    return result ? result.originalValue : match;
  });
}

const secureOpenAI = new SecureOpenAI(process.env.OPENAI_API_KEY);

app.post('/anonymize', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const anonymizedMessage = await anonymizeMessage(message);
    res.json({ anonymizedMessage });
  } catch (error) {
    console.error('Error anonymizing message:', error);
    res.status(500).json({ error: 'An error occurred while anonymizing the message' });
  }
});

app.post('/deanonymize', async (req, res) => {
  const { anonymizedMessage } = req.body;

  if (!anonymizedMessage) {
    return res.status(400).json({ error: 'Anonymized message is required' });
  }

  try {
    const message = await deanonymizeMessage(anonymizedMessage);
    res.json({ message });
  } catch (error) {
    console.error('Error deanonymizing message:', error);
    res.status(500).json({ error: 'An error occurred while deanonymizing the message' });
  }
});

app.post('/secureChatGPT', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log('Received prompt:', prompt);

    // Step 1: Anonymize the prompt
    console.log('Anonymizing prompt...');
    const anonymizedPrompt = await anonymizeMessage(prompt);
    console.log('Anonymized prompt:', anonymizedPrompt);

    // Step 2: Send anonymized prompt to ChatGPT
    console.log('Sending anonymized prompt to ChatGPT...');
    const anonymizedResponse = await secureOpenAI.completeText(anonymizedPrompt);
    console.log('Received anonymized response from ChatGPT:', anonymizedResponse);

    // Step 3: Deanonymize the response
    console.log('Deanonymizing response...');
    const deanonymizedResponse = await deanonymizeMessage(anonymizedResponse);
    console.log('Deanonymized response:', deanonymizedResponse);

    // Step 4: Send the response to the client
    res.json({ 
      originalPrompt: prompt,
      anonymizedPrompt: anonymizedPrompt,
      deanonymizedResponse: deanonymizedResponse 
    });

  } catch (error) {
    console.error('Error in secureChatGPT endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing the prompt' });
  }
});

// Connect to MongoDB before starting the server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
