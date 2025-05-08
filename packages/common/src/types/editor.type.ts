/**
 * Represents a single block of data within an editor.
 */
export interface EditorBlockData<T = any> {
  id: string; // Unique ID for the block
  type: string; // Type of the block (e.g., 'paragraph', 'header', 'image')
  data: T; // Block-specific data
  tunes?: { [name: string]: any }; // Optional tunes or settings for the block
}

/**
 * Represents the overall output data from a block-style editor.
 */
export interface EditorOutputData {
  time: number; // Timestamp of when the data was saved
  version: string; // Version of the editor or data format
  blocks: EditorBlockData[]; // Array of editor blocks
}

/**
 * Represents a child element within an editor content block,
 * typically a span of text with specific formatting.
 */
export interface EditorContentChild {
  text: string;
  italic?: boolean;
  bold?: boolean;
  // Ví dụ: text_color, background_color nếu có
}

/**
 * Represents a single block of content within the editor.
 */
export interface EditorContent {
  id: string;
  url?: string; // For linkable content or media source
  type: string; // e.g., 'paragraph', 'image', 'video', 'embed'
  children: EditorContentChild[];
  // Ví dụ: created_at, updated_at nếu content này có timestamp
}
