// Background color plugin for theme-aware chart backgrounds
export const backgroundColorPlugin = {
	id: 'backgroundColorPlugin',
	beforeDraw: (chart, args, options) => {
		const backgroundColor = options?.backgroundColor || chart.options?.plugins?.backgroundColorPlugin?.backgroundColor;
		if (!backgroundColor) return;

		const { ctx, width, height } = chart;
		ctx.save();
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width, height);
		ctx.restore();
	}
};
