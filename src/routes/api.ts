import { Router } from 'express';

import cheerio from 'cheerio';
import fetch from 'node-fetch';
import normalize from 'normalize-url';
import keywords from '../utils/keywords';
import examples from '../utils/examples';
import { bias } from '../utils/genderBias';

import {
  WordTokenizer,
  SentenceTokenizer,
  SentimentAnalyzer,
  PorterStemmer,
  BayesClassifier,
} from 'natural';

export default {
  path: '/api/v1',
  action() {
    const router = new Router();
    const wordTokenizer = new WordTokenizer();
    const sentenceTokenizer = new SentenceTokenizer();
    const sentimentAnalyzer = new SentimentAnalyzer('English', PorterStemmer, 'senticon');
    const classifier = new BayesClassifier();

    const cache = new Map();

    const scrapeTextFromURL = async (url: string) => {
      const response = await fetch(normalize(url));

      if (!response.ok) throw new Error('Not able to find website');

      const html = await response.text();
      const $ = cheerio.load(html);
      const text = $('body').text();

      return text.replace(/\s+/gim, ' ');
    };

    const getWords = (text: string) => {
      return wordTokenizer.tokenize(text);
    };

    const getSentences = (text: string) => {
      return sentenceTokenizer.tokenize(text);
    };

    const getSentimentFromSentence = (sentence: string[]) => {
      return sentimentAnalyzer.getSentiment(sentence);
    };

    const getClassification = (content: string) => {
      return classifier.classify(content);
    };

    const trainClassifier = (data: string[][], keywords: string[]) => {
      for (const [key, value] of data) {
        classifier.addDocument(key, value);
      }

      // classifier.addDocument(keywords, 'bad');
      classifier.train();
    };

    const getTeardown = (content: string) => {
      const sentences = getSentences(content);
      const sentiment = {
        sentenceBySentenceScore: [],
        verdict: 0,
      };
      const classification = {
        sentenceBySentenceScore: [],
        verdict: 'neutral',
        teardown: {
          good: 0,
          bad: 0,
        },
      };
      const staticKeyword = {
        sentenceBySentenceScore: [],
        verdict: 0,
        teardown: {
          total: 0,
        },
      };
      const genderBias = {
        sentenceBySentenceScore: [],
        verdict: 'neutral',
        teardown: {
          male: 0,
          female: 0,
        },
      };

      const MATCH_KEYWORD_RE = new RegExp(`\\b${keywords.join('|')}\\b`, 'gim');

      for (const sentence of sentences) {
        const sentimentScore = getSentimentFromSentence(getWords(sentence));
        const keywordMatches = (sentence.match(MATCH_KEYWORD_RE) || []).length;

        sentiment.sentenceBySentenceScore.push(sentimentScore);
        sentiment.verdict += sentimentScore;
        classification.sentenceBySentenceScore.push(getClassification(sentence));
        staticKeyword.sentenceBySentenceScore.push(keywordMatches);
        staticKeyword.verdict += keywordMatches;

        staticKeyword.teardown.total += keywordMatches;
        genderBias.sentenceBySentenceScore.push(bias(sentence).verdict);
      }

      staticKeyword.verdict /= getWords(content).length;

      const maleClassifications = genderBias.sentenceBySentenceScore.filter(
        (classification) => classification === 'male'
      ).length;

      const femaleClassifications = genderBias.sentenceBySentenceScore.length - maleClassifications;

      genderBias.verdict = maleClassifications > femaleClassifications ? 'male' : 'female';

      const { female, male } = bias(content);

      genderBias.teardown.female = female;
      genderBias.teardown.male = male;

      const goodClassifications = classification.sentenceBySentenceScore.filter(
        (classification) => classification === 'good'
      ).length;

      const badClassifications =
        classification.sentenceBySentenceScore.length - goodClassifications;

      classification.verdict = goodClassifications > badClassifications ? 'good' : 'bad';

      classification.teardown.good = goodClassifications;
      classification.teardown.bad = badClassifications;

      delete sentiment.sentenceBySentenceScore;
      delete classification.sentenceBySentenceScore;
      delete staticKeyword.sentenceBySentenceScore;
      delete genderBias.sentenceBySentenceScore;

      return { sentiment, classification, staticKeyword, genderBias };
    };

    trainClassifier(examples, keywords);

    router.get('/scrape', async (req, res) => {
      try {
        const url: string = req.body.url ?? req.query.url;

        if (cache.has(url)) return res.json(cache.get(url));

        const raw = await scrapeTextFromURL(url);
        const teardown = getTeardown(raw);
        const payload = { ...teardown, numberOfSentences: getSentences(raw).length };

        cache.set(url, payload);

        return res.json(payload);
      } catch (err) {
        res.boom.badRequest(err);
      }
    });

    router.get('*', (_req, res) => {
      res.boom.notFound();
    });

    return router;
  },
};
