# Data Privacy Vault

## Project Description

Data Privacy Vault is a Node.js application designed to anonymize and deanonymize personally identifiable information (PII) such as names, email addresses, and phone numbers. It provides a secure way to process sensitive information by replacing PII with tokens, and integrates with OpenAI's GPT model for text completion while maintaining privacy.

Key features:
- Anonymization of PII in text messages
- Deanonymization of previously anonymized messages
- Persistent storage of token mappings using MongoDB
- Secure integration with OpenAI's GPT model for text completion
- RESTful API endpoints for anonymization, deanonymization, and secure chat completion

## Installation Steps

1. **Prerequisites**
   - Node.js (v14 or later)
   - MongoDB
   - OpenAI API key

2. **Clone the repository**
   ```
   git clone https://github.com/yourusername/data-privacy-vault.git
   cd data-privacy-vault
   ```

3. **Install dependencies**
   ```
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the project root and add the following:
   ```
   MONGO_URI=mongodb://your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```
   Replace `your_mongodb_connection_string` with your MongoDB connection string and `your_openai_api_key` with your OpenAI API key.

5. **Start the server**
   ```
   node server.js
   ```
   The server should now be running at `http://localhost:3001`.

## Usage

The application provides the following API endpoints:

1. **Anonymize**: 
   ```
   POST /anonymize
   Body: { "message": "Your message containing PII" }
   ```

2. **Deanonymize**: 
   ```
   POST /deanonymize
   Body: { "anonymizedMessage": "Your anonymized message" }
   ```

3. **Secure ChatGPT**: 
   ```
   POST /secureChatGPT
   Body: { "prompt": "Your prompt containing PII" }
   ```

Use these endpoints to anonymize sensitive information, deanonymize previously anonymized messages, and interact with the OpenAI GPT model securely.

## Note

This project is designed for educational purposes and may need additional security measures before being used in a production environment.
