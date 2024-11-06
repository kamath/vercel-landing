import { createOpenAI } from '@ai-sdk/openai';
import { generateId } from 'ai';

const perplexity = createOpenAI({
	name: 'perplexity',
	apiKey: process.env.PERPLEXITY_API_KEY ?? '',
	baseURL: 'https://api.perplexity.ai/',
});

import { streamText, StreamData } from 'ai';

export async function POST(req: Request) {
	const { messages } = await req.json();

	// Create a new StreamData object
	const data = new StreamData();

	// Append to general streamed data
	data.append({ test: 'initialized calls' });

	const result = await streamText({
		model: perplexity('llama-3-sonar-large-32k-online'),
		onFinish() {
			// message annotation:
			data.appendMessageAnnotation({
				id: generateId(), // e.g. id from saved DB record
				other: 'information',
			});

			// call annotation (can be any JSON serializable value)
			data.append('call completed');

			// close the StreamData object
			data.close();
		},
		messages,
	});

	// Respond with the stream and additional StreamData
	return result.toDataStreamResponse({ data });
}