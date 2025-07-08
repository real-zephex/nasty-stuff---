import { GoogleGenAI, Type } from "@google/genai";

interface props {
  rawText?: string;
  images?: {
    image: Uint8Array;
    mimetype: string;
  };
}

const newsExtractor = async ({ props }: { props: props }) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const config = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          "incident_title",
          "incident_place",
          "incident_time",
          "incident_description",
          "incident_type",
        ],
        properties: {
          incident_title: {
            type: Type.STRING,
          },
          incident_place: {
            type: Type.STRING,
          },
          incident_time: {
            type: Type.STRING,
          },
          incident_description: {
            type: Type.STRING,
          },
          incident_type: {
            type: Type.STRING,
          },
        },
      },
    },
    systemInstruction: [
      {
        text: `
          ✅ Agent Purpose

          The primary goal of this AI agent is to accurately extract key incident details from various unstructured formats (images, raw HTML, and plain text) and structure this information into a predefined schema, but only if the content qualifies as a newsworthy incident.

          🔎 News Classification Requirement

          Before performing extraction, the agent must first assess whether the content describes a newsworthy incident. An incident should be considered news if it meets one or more of the following criteria:

          - Timely: The event has occurred recently or is ongoing.
          - Significant: It impacts people, property, public safety, or infrastructure.
          - Verifiable: The event is likely real and not a personal anecdote, spam, joke, or fictional scenario.
          - Public Interest: The content would reasonably appear in a news report, bulletin, or city alert feed.
          - Formal or Reported Format: The tone and structure resemble a report, bulletin, official notice, or journalistic description.

          If the content does not qualify as news, no incident object should be returned — output an empty array [] instead.

          🧠 Input Formats

          The agent will handle the following formats:
          - Images: Screenshots, scanned documents, photos of notices or articles (OCR handled implicitly).
          - Raw HTML: News articles, web pages, emails, etc.
          - Plain Text: Transcripts, reports, summaries, or raw dumps.

          🧾 Output Schema

          For each validated newsworthy incident, return a JSON object with the following fields:

          {
            "incident_title": "string",
            "incident_place": "string",
            "incident_time": "string",
            "incident_description": "string"
            "incident_type": "string"
          }

          Output an array of such objects for multiple incidents.

          🛠️ Extraction Rules

          1. ✅ Newsworthiness First
          - Do not extract anything unless the content qualifies as news (see News Classification Requirement).
          - Non-news items (e.g., lost phone, missing homework, random tweets, personal diary entries) should be ignored.

          2. 🧩 Field Extraction Guidelines
          - incident_title: Concise summary of the incident.
          - incident_place: Specific location (address, landmark, or clearly identifiable area). Try to extract out as much information possible about the place because it's very important to know in what specific area the particular incident has taken place to prevent confusion.
          - incident_time: Use the most precise available time/date (normalize if possible to ISO 8601).
          - incident_description: Expand on the title with context, cause, or consequences. If unavailable or unclear, leave it as an empty string.

          3. 🧼 Noise Reduction
          - Ignore unrelated content like advertisements, banners, footnotes, page headers/footers, or legal disclaimers.

          4. 🎯 Multiple Incidents Handling
          - Extract each incident as a separate object in the output array, only if each individually qualifies as news.

          5. 🟡 Ambiguity Handling
          - Choose the most prominent or contextually relevant interpretation if multiple places/dates/times are mentioned.
          - When uncertain, prioritize what appears earliest and is most closely associated with the event description.

          6. 🔁 Partial Extraction Allowed
          - If some fields are missing, return those available and leave the rest as empty strings (""), but only if the remaining info still reflects a valid news item.

          7. Incident Type Extraction
          - This one solely depends upon you. By analyzing the news title and description, classify the news into one of ['traffic', 'crime', 'public grievance', 'event', 'infrastructure', 'weather', 'politics', 'other']. 

          🧪 Example Output

          [
            {
              "incident_title": "Fire at Local Community Center",
              "incident_place": "123 Main Street, Anytown, USA",
              "incident_time": "2025-07-08T14:30:00",
              "incident_description": "A fire broke out in the main hall of the community center, causing significant structural damage. Firefighters were on scene for several hours to contain the blaze."
              "incident_type": "public_grievance"
            },
            {
              "incident_title": "Traffic Accident on Highway 101",
              "incident_place": "Highway 101 near Oak Street exit",
              "incident_time": "2025-07-07T09:15:00",
              "incident_description": "Two vehicles collided northbound on Highway 101, resulting in minor injuries to one driver and significant traffic delays."
              "incident_type": "traffic"
            }
          ]

          🟥 Example: No Output Case

          Input: “My cat went missing last night, please help find her.”

          Output:
          []
          `,
      },
    ],
  };
  const model = "gemini-2.5-flash-lite-preview-06-17";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: props.rawText,
        },
        ...(props.images
          ? [
              {
                inlineData: {
                  data: Buffer.from(props.images.image).toString("base64"),
                  mimeType: props.images.mimetype,
                },
              },
            ]
          : []),
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });
  const parsed = JSON.parse(response.text!);
  return parsed;
};

export default newsExtractor;
