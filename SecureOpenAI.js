const { OpenAI } = require('openai');
const winston = require('winston');

class SecureOpenAI {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'secureOpenAI.log' })
      ]
    });
  }

  async completeText(prompt) {
    this.logger.info('Sending prompt to OpenAI');
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150
      });
      const response = completion.choices[0].message.content;
      this.logger.info('Received response from OpenAI');
      return response;
    } catch (error) {
      this.logger.error('Error in OpenAI text completion:', error);
      throw error;
    }
  }
}

module.exports = SecureOpenAI;
