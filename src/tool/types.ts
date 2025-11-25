export interface ToolThemes {
  primary: string;
  secondary: string[];
}

export interface ToolMetadata {
  tool_name: string;
  category: string;
  themes: ToolThemes;
  tags: string[];
  repository: string;
}

export interface ToolFrontmatter {
  tool_name: string;
  repository: string;
  category: string;
  themes: string[];
  tags: string[];
  submitted_date?: string;
}

export interface ToolInfo extends ToolFrontmatter {
  filename: string;
  description: string;
}
