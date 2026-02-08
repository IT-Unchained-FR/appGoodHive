import { GoogleAuth } from "google-auth-library";

export type RagContext = {
  text: string;
  sourceUri?: string;
  sourceDisplayName?: string;
  score?: number;
  chunk?: unknown;
};

export type RetrieveRagContextsResult = {
  contexts: RagContext[];
  raw: unknown;
};

type RagRequestFormat = "snake" | "camel";

const DEFAULT_TOP_K = 6;

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const parseBoolean = (value?: string) => {
  if (!value) return false;
  return ["true", "1", "yes", "y"].includes(value.toLowerCase());
};

const parseNumber = (value?: string) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseCsv = (value?: string) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const resolveProjectId = () =>
  process.env.RAG_PROJECT_ID ||
  process.env.VERTEX_AI_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "";

const resolveLocation = () =>
  process.env.RAG_LOCATION || process.env.VERTEX_AI_LOCATION || "us-central1";

const resolveCorpusResource = (projectId: string, location: string) => {
  const explicit = process.env.RAG_CORPUS_RESOURCE;
  if (explicit) return explicit;
  const corpusId = process.env.RAG_CORPUS_ID || process.env.RAG_CORPUS;
  if (!corpusId) return "";
  return `projects/${projectId}/locations/${location}/ragCorpora/${corpusId}`;
};

const resolveRequestFormat = (apiVersion: string): RagRequestFormat => {
  const fromEnv = process.env.RAG_REQUEST_FORMAT?.toLowerCase();
  if (fromEnv === "camel" || fromEnv === "snake") return fromEnv;
  return apiVersion === "v1" ? "camel" : "snake";
};

const buildEndpoint = (projectId: string, location: string) => {
  const apiVersion = process.env.RAG_API_VERSION || "v1beta1";
  const serviceEndpoint =
    process.env.RAG_API_ENDPOINT || `${location}-aiplatform.googleapis.com`;
  return {
    apiVersion,
    url: `https://${serviceEndpoint}/${apiVersion}/projects/${projectId}/locations/${location}:retrieveContexts`,
  };
};

const normalizeContext = (context: Record<string, unknown>): RagContext => {
  const sourceUri =
    (context.sourceUri as string) ||
    (context.source_uri as string) ||
    undefined;
  const sourceDisplayName =
    (context.sourceDisplayName as string) ||
    (context.source_display_name as string) ||
    undefined;
  const text = (context.text as string) || "";
  const score =
    (context.score as number) ||
    (context.distance as number) ||
    (context.sparse_distance as number) ||
    undefined;
  const chunk = context.chunk ?? undefined;
  return {
    text,
    sourceUri,
    sourceDisplayName,
    score,
    chunk,
  };
};

const buildRequestBody = (params: {
  queryText: string;
  ragCorpusResource: string;
  ragFileIds: string[];
  similarityTopK: number;
  vectorDistanceThreshold?: number | null;
  requestFormat: RagRequestFormat;
}) => {
  const {
    queryText,
    ragCorpusResource,
    ragFileIds,
    similarityTopK,
    vectorDistanceThreshold,
    requestFormat,
  } = params;

  if (requestFormat === "camel") {
    const ragResource: Record<string, unknown> = {
      ragCorpus: ragCorpusResource,
    };
    if (ragFileIds.length) {
      ragResource.ragFileIds = ragFileIds;
    }
    const ragResources = [ragResource];
    const vertexRagStore: Record<string, unknown> = {
      ragResources,
    };
    if (vectorDistanceThreshold !== null && vectorDistanceThreshold !== undefined) {
      vertexRagStore.vectorDistanceThreshold = vectorDistanceThreshold;
    }
    return {
      query: {
        text: queryText,
        similarityTopK,
      },
      vertexRagStore,
    };
  }

  const ragResource: Record<string, unknown> = {
    rag_corpus: ragCorpusResource,
  };
  if (ragFileIds.length) {
    ragResource.rag_file_ids = ragFileIds;
  }
  const rag_resources = [ragResource];
  const vertex_rag_store: Record<string, unknown> = {
    rag_resources,
  };
  if (vectorDistanceThreshold !== null && vectorDistanceThreshold !== undefined) {
    vertex_rag_store.vector_distance_threshold = vectorDistanceThreshold;
  }
  return {
    query: {
      text: queryText,
      similarity_top_k: similarityTopK,
    },
    vertex_rag_store,
  };
};

export const retrieveRagContexts = async (
  queryText: string
): Promise<RetrieveRagContextsResult | null> => {
  const projectId = resolveProjectId();
  const location = resolveLocation();
  const ragCorpusResource = resolveCorpusResource(projectId, location);
  const enabledSetting = process.env.RAG_ENGINE_ENABLED;
  const enabled =
    (enabledSetting ? parseBoolean(enabledSetting) : false) ||
    Boolean(ragCorpusResource);

  if (!enabled) return null;
  if (!projectId || !ragCorpusResource) {
    console.warn("[rag-engine] Missing RAG_PROJECT_ID or RAG_CORPUS_RESOURCE.");
    return null;
  }

  const similarityTopK =
    parseNumber(process.env.RAG_SIMILARITY_TOP_K) ?? DEFAULT_TOP_K;
  const vectorDistanceThreshold = parseNumber(
    process.env.RAG_VECTOR_DISTANCE_THRESHOLD
  );
  const ragFileIds = parseCsv(process.env.RAG_FILE_IDS);
  const { apiVersion, url } = buildEndpoint(projectId, location);
  const requestFormat = resolveRequestFormat(apiVersion);

  const body = buildRequestBody({
    queryText,
    ragCorpusResource,
    ragFileIds,
    similarityTopK,
    vectorDistanceThreshold,
    requestFormat,
  });

  const headers = await auth.getRequestHeaders();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[rag-engine] retrieveContexts failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    contexts?: { contexts?: Record<string, unknown>[] } | Record<string, unknown>[];
  };
  const rawContexts = Array.isArray(data.contexts)
    ? data.contexts
    : data.contexts?.contexts ?? [];

  const contexts = rawContexts
    .map((context) => normalizeContext(context))
    .filter((context) => context.text.trim().length > 0);

  return { contexts, raw: data };
};
