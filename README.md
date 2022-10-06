# Reword

Reword is an API that paraphrases your text to make it unique with the help of Google Translate and Puppeteer.

Your text gets translated through the chain of specified languages and back to the original language thereby giving you the text with better uniqueness.

# API

```
POST /api/v1/paraphrase
```

Request format:

```Json
{
  "text": "Hello, World",
  "from": "en",
  "langs": ["ru", "es", "it"]
}
```
