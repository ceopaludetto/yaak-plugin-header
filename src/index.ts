import type { CallTemplateFunctionArgs, Context, PluginDefinition } from "@yaakapp/api";

export const plugin: PluginDefinition = {
	templateFunctions: [{
		name: "header",
		args: [
			{
				type: "http_request",
				name: "request",
				label: "Request",
			},
			{
				type: "text",
				name: "path",
				label: "Header Name",
			},
			{
				type: "select",
				name: "behavior",
				label: "Sending Behavior",
				defaultValue: "smart",
				options: [
					{ name: "When no responses", value: "smart" },
					{ name: "Always", value: "always" },
				],
			},
		],
		onRender: async (ctx: Context, { values, purpose }: CallTemplateFunctionArgs): Promise<string | null> => {
			if (!values.request || !values.path) return null;

			const request = await ctx.httpRequest.getById({ id: values.request });
			if (!request) return null;

			const responses = await ctx.httpResponse.find({ requestId: request.id, limit: 1 });
			if (values.behavior === "never" && responses.length === 0) return null;

			let response = responses[0];
			const behavior = values.behavior === "always" && purpose === "preview" ? "smart" : values.behavior; // Convert to smart if preview

			if (behavior === "smart" && !response) {
				const rendered = await ctx.httpRequest.render({ httpRequest: request, purpose });
				response = await ctx.httpRequest.send({ httpRequest: rendered });
			}

			if (!response || !response.headers) return null;

			return response.headers
				.find((item) => item.name.toLowerCase().trim() === values.path?.toLowerCase().trim())
				?.value ?? null;
		},
	}],
};
