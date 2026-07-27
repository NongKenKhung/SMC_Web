/** Types กลางที่ frontend/backend ใช้ร่วมกัน (จะขยายในเฟส 2-4) */

export type PostCategory = "ACTIVITY" | "NEWS" | "WORK";

export interface SolutionNode {
  id: number;
  slug: string;
  nameTh: string;
  nameEn: string | null;
  summaryTh: string | null;
  icon: string | null;
  order: number;
  children: SolutionNode[];
}

export interface PartnerDto {
  id: number;
  name: string;
  caption: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  order: number;
}

export interface PostListItem {
  id: number;
  slug: string;
  titleTh: string;
  excerptTh: string | null;
  coverImage: string | null;
  category: PostCategory;
  publishedAt: string;
}
