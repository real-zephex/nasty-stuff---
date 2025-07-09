export interface BN {
  status: boolean;
  data: NewsOBJ[] | null;
}

export interface NewsOBJ {
  incident_title: string;
  incident_time: string;
  incident_description: string;
  incident_place: string;
}

// Hindustan Time News Information Types

export interface HTnewsInformation {
  content: Content;
}

interface Content {
  sectionName: string;
  sectionUrl: string;
  sectionItems: SectionItems;
  deleted: boolean;
  newsBelongsTo: null;
}

interface SectionItems {
  contentType: string;
  websiteURL: string;
  headLine: string;
  itemId: string;
  authorName: string;
  agencyName: string;
  city: string;
  publishedDate: string;
  lastModified: string;
  longHeadline: string;
  storyText: string;
  primaryParentCategory: string;
  thumbImage: string;
  mediumRes: string;
  wallpaperLarge: string;
  emailAuthor: string;
  videoScript: string;
  caption: string;
  keywords: string;
  exclusiveStory: boolean;
  audioSourceURL: string;
}
