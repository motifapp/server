// Adapted from https://github.com/darenr/gender-bias

let regex_feminine_coded_words = /(\s+agree\w{0,}|\s+affectionate\w{0,}|\s+child\w{0,}|\s+cheer\w{0,}|\s+collab\w{0,}|\s+commit\w{0,}|\s+communal\w{0,}|\s+compassion\w{0,}|\s+connect\w{0,}|\s+consider\w{0,}|\s+cooperat\w{0,}|\s+co-operat\w{0,}|\s+depend\w{0,}|\s+emotiona\w{0,}|\s+empath\w{0,}|\s+feel\w{0,}|\s+flatterable\w{0,}|\s+gentle\w{0,}|\s+honest\w{0,}|\s+interpersonal\w{0,}|\s+interdependen\w{0,}|\s+interpersona\w{0,}|\s+inter-personal\w{0,}|\s+inter-dependen\w{0,}|\s+inter-persona\w{0,}|\s+kind\w{0,}|\s+kinship\w{0,}|\s+loyal\w{0,}|\s+modesty\w{0,}|\s+nag\w{0,}|\s+nurtur\w{0,}|\s+pleasant\w{0,}|\s+polite\w{0,}|\s+quiet\w{0,}|\s+respon\w{0,}|\s+sensitiv\w{0,}|\s+submissive\w{0,}|\s+support\w{0,}|\s+sympath\w{0,}|\s+tender\w{0,}|\s+together\w{0,}|\s+trust\w{0,}|\s+understand\w{0,}|\s+warm\w{0,}|\s+whin\w{0,}|\s+enthusias\w{0,}|\s+inclusive\w{0,}|\s+yield\w{0,}|\s+shar\w{0,})/giu;

let regex_masculine_coded_words = /(\s+active\w{0,}|\s+adventurous\w{0,}|\s+aggress\w{0,}|\s+ambitio\w{0,}|\s+analy\w{0,}|\s+assert\w{0,}|\s+athlet\w{0,}|\s+ninja|\s+autonom\w{0,}|\s+battle\w{0,}|\s+boast\w{0,}|\s+challeng\w{0,}|\s+champion\w{0,}|\s+compet\w{0,}|\s+confident\w{0,}|\s+courag\w{0,}|\s+decid\w{0,}|\s+decision\w{0,}|\s+decisive\w{0,}|\s+defend\w{0,}|\s+determin\w{0,}|\s+domina\w{0,}|\s+dominant\w{0,}|\s+driven\w{0,}|\s+fearless\w{0,}|\s+dominant\w{0,}|\s+fight\w{0,}|\s+force\w{0,}|\s+greedy\w{0,}|\s+head-strong\w{0,}|\s+headstrong\w{0,}|\s+hierarch\w{0,}|\s+hostil\w{0,}|\s+impulsive\w{0,}|\s+independen\w{0,}|\s+individual\w{0,}|\s+intellect\w{0,}|\s+lead\w{0,}|\s+logic\w{0,}|\s+objective\w{0,}|\s+opinion\w{0,}|\s+outspoken\w{0,}|\s+rock\s+star|\s+persist\w{0,}|\s+principle\w{0,}|\s+reckless\w{0,}|\s+self-confiden\w{0,}|\s+self-relian\w{0,}|\s+self-sufficien\w{0,}|\s+selfconfiden\w{0,}|\s+selfrelian\w{0,}|\s+selfsufficien\w{0,}|\s+stubborn\w{0,}|\s+superior\w{0,}|\s+unreasonab\w{0,})/giu;

export function getMatches(string, regex, index) {
  index || (index = 1);
  const matches = [];
  let match;
  while ((match = regex.exec(string))) {
    matches.push(match[index].trim());
  }
  return matches;
}

export function bias(phrase) {
  const tokens = phrase.replace('/ {2,}/', ' ').toLowerCase().trim().split(' ');
  let coding = '';
  let feminine_words = [];
  let masculine_words = [];
  let feminine_word_count = 0;
  let masculine_word_count = 0;

  /*
   create a cleaned up document in which to perform word stem searches.
  */
  const doc = tokens.join(' ');

  feminine_words = getMatches(doc, regex_feminine_coded_words, 1);
  masculine_words = getMatches(doc, regex_masculine_coded_words, 1);

  feminine_word_count = feminine_words.length;
  masculine_word_count = masculine_words.length;

  const coding_score = feminine_word_count - masculine_word_count;

  if (coding_score === 0) {
    coding = 'neutral';
  } else if (feminine_word_count > masculine_word_count) {
    coding = 'female';
  } else {
    coding = 'male';
  }

  return {
    verdict: coding,
    coding_score,
    feminine_words,
    masculine_words,
  };
}
