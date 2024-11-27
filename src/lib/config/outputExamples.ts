import { AnalysisTask } from '@/types';

export const OUTPUT_EXAMPLES: Record<AnalysisTask, any> = {
  sentenceStructure: {
    subject: "The curious student",
    predicate: "was reading",
    object: "a fascinating book about quantum physics",
    clauses: [
      {
        type: "main",
        content: "The curious student was reading a fascinating book"
      },
      {
        type: "prepositional",
        content: "about quantum physics"
      }
    ],
    structure: "Simple sentence with a compound object and prepositional phrase"
  },
  thematicAnalysis: {
    theme: "Environmental Conservation and Sustainable Development",
    keywords: [
      "climate change",
      "renewable energy",
      "carbon footprint",
      "sustainability"
    ],
    summary: "The article discusses the urgent need for environmental conservation...",
    mainIdeas: [
      "Global warming's impact on ecosystems",
      "Renewable energy solutions",
      "Individual actions for sustainability"
    ]
  },
  vocabularyAnalysis: {
    keywords: [
      {
        word: "sustainable",
        partOfSpeech: "adjective",
        definition: "able to be maintained at a certain level without depleting resources",
        usage: "We need to develop sustainable farming practices."
      },
      {
        word: "conservation",
        partOfSpeech: "noun",
        definition: "prevention of wasteful use of a resource",
        usage: "Wildlife conservation is crucial for maintaining biodiversity."
      }
    ],
    phrases: [
      {
        phrase: "take into account",
        meaning: "to consider or include something when making a decision",
        example: "We must take into account the environmental impact."
      }
    ],
    difficulty: "intermediate",
    usage: [
      "Academic writing",
      "Environmental science",
      "Policy documents"
    ]
  },
  backgroundKnowledge: {
    historicalContext: "The environmental movement gained momentum in the 1970s...",
    culturalReferences: [
      "Silent Spring by Rachel Carson",
      "Earth Day establishment in 1970",
      "The Paris Agreement of 2015"
    ],
    relatedTopics: [
      "Environmental Science",
      "Climate Change",
      "International Environmental Law"
    ],
    additionalResources: [
      {
        type: "book",
        title: "Silent Spring",
        author: "Rachel Carson",
        year: 1962
      },
      {
        type: "website",
        name: "UN Environment Programme",
        url: "https://www.unep.org"
      }
    ]
  }
};
