'use server';

import { streamUI } from 'ai/rsc';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const perplexity = createOpenAI({
	name: 'perplexity',
	apiKey: process.env.PERPLEXITY_API_KEY ?? '',
	baseURL: 'https://api.perplexity.ai/',
});

const LoadingComponent = () => (
	<div className="animate-pulse p-4">getting weather...</div>
);

const getWeather = async () => {
	await new Promise(resolve => setTimeout(resolve, 2000));
	return '82°F️ ☀️';
};

interface WeatherProps {
	location: string;
	weather: string;
}

const WeatherComponent = (props: WeatherProps) => (
	<div className="border border-neutral-200 p-4 rounded-lg max-w-fit">
		The weather in {props.location} is {props.weather}
	</div>
);

export async function streamComponent() {
	const result = await streamUI({
		model: perplexity('llama-3.1-sonar-small-128k-chat'),
		prompt: 'Get the weather for San Francisco',
		text: ({ content }) => <div>{content}</div>,
		tools: {
			getWeather: {
				description: 'Get the weather for a location',
				parameters: z.object({
					location: z.string(),
				}),
				generate: async function* ({ location }) {
					yield <LoadingComponent />;
					const weather = await getWeather();
					return <WeatherComponent weather={weather} location={location} />;
				},
			},
		},
	});

	return result.value;
}