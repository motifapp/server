import { Router } from 'express';

import cheerio from 'cheerio';
import fetch from 'node-fetch';
import normalize from 'normalize-url';
import keywords from '../utils/keywords';
import examples from '../utils/examples';

import {
  WordTokenizer,
  SentenceTokenizer,
  SentimentAnalyzer,
  PorterStemmer,
  BayesClassifier,
} from 'natural';
import { getPackedSettings } from 'http2';
import { stringify } from 'querystring';

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

    const average = (...nums: number[]) => {
      return nums.reduce((a, b) => a + b) / nums.length;
    };

    const getTeardown = (content: string) => {
      const sentences = getSentences(content);
      const sentiment = {
        sentenceBySentenceScores: [],
        metrics: {
          sentenceMajority: 0,
          genericAnalysis: 0,
        },
      };
      const classification = {
        sentenceBySentenceScore: [],
        metrics: {
          sentenceMajority: 'neutral',
          genericAnalysis: 'neutral',
          teardown: {
            good: 0,
            bad: 0,
          },
        },
      };
      const staticKeyword = {
        sentenceBySentenceScore: [],
        metrics: {
          sentenceMajority: 0,
          genericAnalysis: 0,
          teardown: {
            total: 0,
          },
        },
      };

      const MATCH_KEYWORD_RE = new RegExp(`\\b${keywords.join('|')}\\b`, 'gim');

      for (const sentence of sentences) {
        const sentimentScore = getSentimentFromSentence(getWords(sentence));
        const keywordMatches = (sentence.match(MATCH_KEYWORD_RE) || []).length;

        sentiment.sentenceBySentenceScores.push(sentimentScore);
        sentiment.metrics.sentenceMajority += sentimentScore;
        classification.sentenceBySentenceScore.push(getClassification(sentence));
        staticKeyword.sentenceBySentenceScore.push(keywordMatches);
        staticKeyword.metrics.sentenceMajority += average(
          staticKeyword.metrics.sentenceMajority,
          keywordMatches / getWords(sentence).length
        );
        staticKeyword.metrics.teardown.total += keywordMatches;
      }

      sentiment.metrics.genericAnalysis = getSentimentFromSentence(getWords(content));
      staticKeyword.metrics.genericAnalysis =
        (content.match(MATCH_KEYWORD_RE) || []).length / getWords(content).length;

      const goodClassifications = classification.sentenceBySentenceScore.filter(
        (classification) => classification === 'good'
      ).length;

      const badClassifications =
        classification.sentenceBySentenceScore.length - goodClassifications;

      classification.metrics.sentenceMajority =
        goodClassifications > badClassifications ? 'good' : 'bad';

      classification.metrics.genericAnalysis = getClassification(content);

      classification.metrics.teardown.good = goodClassifications;
      classification.metrics.teardown.bad = badClassifications;

      return { sentiment, classification, staticKeyword };
    };

    trainClassifier(examples, keywords);

    router.get('/scrape', async (req, res) => {
      try {
        const url: string = req.body.url ?? req.query.url;

        if (cache.has(url)) return res.json(cache.get(url));

        const raw = await scrapeTextFromURL(url);
        const teardown = getTeardown(raw);

        cache.set(url, teardown);

        return res.json(teardown);
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
