import Replicate from "replicate";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  console.warn("REPLICATE_API_TOKEN not configured. AI features will be unavailable.");
}

export const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN || "",
});

export interface AIToolDefinition {
  id: string;
  name: string;
  description: string;
  category: "upscale" | "denoise" | "color" | "sky" | "general";
  modelVersion: string;
  costPerImage: number; // in cents
  creditsPerImage: number; // credits consumed
  estimatedTimeSeconds: number;
}

export const AI_TOOLS: Record<string, AIToolDefinition> = {
  upscale_x2: {
    id: "upscale_x2",
    name: "Upscale 2x",
    description: "Upscale image by 2x using AI super-resolution",
    category: "upscale",
    modelVersion: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
    costPerImage: 10,
    creditsPerImage: 1,
    estimatedTimeSeconds: 15,
  },
  upscale_x4: {
    id: "upscale_x4",
    name: "Upscale 4x",
    description: "Upscale image by 4x using AI super-resolution",
    category: "upscale",
    modelVersion: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
    costPerImage: 20,
    creditsPerImage: 2,
    estimatedTimeSeconds: 30,
  },
  denoise: {
    id: "denoise",
    name: "Denoise",
    description: "Remove noise from image using AI",
    category: "denoise",
    modelVersion: "pollinations/modnet:6205fd9e3e66e28e96acf31d91b088868f2e6c5f48b69a7e2cbe3c5ea76d8dcc",
    costPerImage: 8,
    creditsPerImage: 1,
    estimatedTimeSeconds: 10,
  },
  wb_normalize: {
    id: "wb_normalize",
    name: "White Balance",
    description: "Auto-correct white balance and color temperature",
    category: "color",
    modelVersion: "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
    costPerImage: 5,
    creditsPerImage: 1,
    estimatedTimeSeconds: 8,
  },
  sky_enhance: {
    id: "sky_enhance",
    name: "Sky Enhancement",
    description: "Replace or enhance sky with AI-generated realistic sky",
    category: "sky",
    modelVersion: "cjwbw/skyreplace:9daa8e69d52c11c1b0d6f3fec3a4e4fd3ce7c5d6b4f9b8e0a2f3e4d5c6b7a8c9",
    costPerImage: 15,
    creditsPerImage: 2,
    estimatedTimeSeconds: 20,
  },
  hdr_merge: {
    id: "hdr_merge",
    name: "HDR Merge",
    description: "Merge bracketed exposures into HDR image",
    category: "general",
    modelVersion: "andreasjansson/stable-diffusion-inpainting:e490d072a34a94a11e9711ed5a6ba621c3fab884eda1665d9d3a282d65a21180",
    costPerImage: 12,
    creditsPerImage: 1,
    estimatedTimeSeconds: 25,
  },
};

export interface RunAIToolParams {
  toolId: string;
  sourceImageUrl: string;
  webhookUrl?: string;
  params?: Record<string, any>;
}

export interface AIJobResult {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  urls?: {
    get: string;
    cancel: string;
  };
}

export async function runAITool(params: RunAIToolParams): Promise<AIJobResult> {
  const tool = AI_TOOLS[params.toolId];
  
  if (!tool) {
    throw new Error(`Unknown AI tool: ${params.toolId}`);
  }

  const input: any = {
    image: params.sourceImageUrl,
    ...params.params,
  };

  if (params.toolId === "upscale_x2") {
    input.scale = 2;
  } else if (params.toolId === "upscale_x4") {
    input.scale = 4;
  }

  const prediction = await replicate.predictions.create({
    model: tool.modelVersion,
    input,
    webhook: params.webhookUrl,
    webhook_events_filter: ["completed"],
  });

  return {
    id: prediction.id,
    status: prediction.status as any,
    output: prediction.output as any,
    error: prediction.error ? String(prediction.error) : undefined,
    urls: prediction.urls,
  };
}

export async function getAIJobStatus(jobId: string): Promise<AIJobResult> {
  const prediction = await replicate.predictions.get(jobId);

  return {
    id: prediction.id,
    status: prediction.status as any,
    output: prediction.output as any,
    error: prediction.error ? String(prediction.error) : undefined,
    urls: prediction.urls,
  };
}

export async function cancelAIJob(jobId: string): Promise<void> {
  await replicate.predictions.cancel(jobId);
}

export function getToolById(toolId: string): AIToolDefinition | undefined {
  return AI_TOOLS[toolId];
}

export function getAllTools(): AIToolDefinition[] {
  return Object.values(AI_TOOLS);
}

export function getToolsByCategory(category: string): AIToolDefinition[] {
  return Object.values(AI_TOOLS).filter((tool) => tool.category === category);
}
