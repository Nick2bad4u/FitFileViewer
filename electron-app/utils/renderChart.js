export function renderChart() {
	const chartContainer = document.getElementById('content-chart');
	chartContainer.innerHTML = '<div id="vega-container"></div>';
	if (window.globalData && window.globalData.recordMesgs) {
		const aq = window.aq;
		const recordTable = aq.from(window.globalData.recordMesgs);
		const columnsToFold = recordTable
			.columnNames()
			.filter((col) => col !== 'timestamp');
		const folded = recordTable.fold(columnsToFold, { as: ['key', 'value'] });
		const spec = {
			config: {
				background: '#181a20',
				text: {
					color: '#e0e0e0',
					fontSize: 14,
				},
				title: {
					anchor: 'middle',
					fontWeight: 'normal',
					titleFontWeight: 'normal',
					labelFontWeight: 'normal',
					fontSize: 30,
					titleFontSize: 16,
					labelFontSize: 14,
					color: '#e0e0e0',
					titleColor: '#e0e0e0',
					labelColor: '#e0e0e0',
					tickColor: '#888',
					domainColor: '#888',
				},
				header: {
					titleFontSize: 22,
					labelFontSize: 18,
					color: '#e0e0e0',
					titleColor: '#e0e0e0',
					labelColor: '#e0e0e0',
					fontWeight: 'normal',
					titleFontWeight: 'normal',
					labelFontWeight: 'normal',
				},
				view: {
					height: 800,
					width: 800,
					strokeWidth: 0,
					fill: '#23263a',
				},
				axis: {
					domain: true,
					domainColor: '#888',
					domainWidth: 1,
					gridWidth: 1,
					labelAngle: 0,
					tickSize: 5,
					gridCap: 'round',
					gridDash: [2, 4],
					fontWeight: 'normal',
					titleFontWeight: 'normal',
					labelFontWeight: 'normal',
					fontSize: 30,
					titleFontSize: 16,
					labelFontSize: 14,
					color: '#e0e0e0',
					titleColor: '#e0e0e0',
					labelColor: '#e0e0e0',
					tickColor: '#888',
				},
				axisX: {
					titleAnchor: 'end',
					titleAlign: 'center',
				},
				axisY: {
					titleAnchor: 'end',
					titleAngle: 0,
					titleAlign: 'center',
					titleY: -15,
					titleX: 0,
				},
				legend: {
					fontWeight: 'normal',
					titleFontWeight: 'normal',
					labelFontWeight: 'normal',
					fontSize: 30,
					titleFontSize: 16,
					labelFontSize: 14,
					color: '#e0e0e0',
					titleColor: '#e0e0e0',
					labelColor: '#e0e0e0',
					tickColor: '#888',
					domainColor: '#888',
				},
			},
			data: { values: folded.objects() },
			facet: {
				row: {
					field: 'key',
					header: {
						labelOrient: 'right',
						labelAngle: 0,
					},
					type: 'nominal',
				},
			},
			spec: {
				layer: [
					{
						mark: {
							type: 'line',
							color: '#1f77b4',
						},
						encoding: {
							opacity: {
								value: 0.2,
							},
							x: {
								field: 'timestamp',
								title: 'Elapsed time (seconds)',
								type: 'temporal',
							},
							y: {
								field: 'value',
								scale: {
									zero: false,
								},
								title: '',
								type: 'quantitative',
							},
						},
						name: 'view_11',
					},
					{
						mark: {
							type: 'line',
							color: '#1f77b4',
						},
						encoding: {
							opacity: {
								value: 1,
							},
							x: {
								field: 'timestamp',
								type: 'temporal',
							},
							y: {
								field: 'value',
								scale: {
									zero: false,
								},
								type: 'quantitative',
							},
						},
						transform: [
							{
								filter: {
									param: 'param_11',
								},
							},
						],
					},
					{
						mark: {
							type: 'rule',
							color: 'firebrick',
							strokeDash: [5, 5],
						},
						encoding: {
							x: {
								aggregate: 'min',
								field: 'timestamp',
								type: 'temporal',
							},
							x2: {
								aggregate: 'max',
								field: 'timestamp',
							},
							y: {
								aggregate: 'min',
								field: 'value',
								scale: {
									zero: false,
								},
								type: 'quantitative',
							},
						},
						transform: [
							{
								filter: {
									param: 'param_11',
								},
							},
						],
					},
					{
						mark: {
							type: 'text',
							color: '#1f77b4',
							dx: 0,
							dy: -50,
							size: 20,
						},
						encoding: {
							text: {
								aggregate: 'mean',
								field: 'value',
								format: '.3f',
								type: 'quantitative',
							},
							x: {
								aggregate: 'mean',
								field: 'timestamp',
								type: 'temporal',
							},
							y: {
								aggregate: 'min',
								field: 'value',
								scale: {
									zero: false,
								},
								type: 'quantitative',
							},
						},
						transform: [
							{
								filter: {
									param: 'param_11',
								},
							},
						],
					},
					{
						mark: {
							type: 'text',
							color: 'firebrick',
							dx: 0,
							dy: -10,
							size: 14,
						},
						encoding: {
							text: {
								aggregate: 'count',
								field: 'value',
								format: '.3f',
								type: 'quantitative',
							},
							x: {
								aggregate: 'mean',
								field: 'timestamp',
								type: 'temporal',
							},
							y: {
								aggregate: 'min',
								field: 'value',
								scale: {
									zero: false,
								},
								type: 'quantitative',
							},
						},
						transform: [
							{
								filter: {
									param: 'param_11',
								},
							},
						],
					},
					{
						mark: {
							type: 'text',
							color: 'firebrick',
							dx: -20,
							dy: -10,
							size: 14,
						},
						encoding: {
							text: {
								aggregate: 'min',
								field: 'timestamp',
								formatType: 'time',
								timeUnit: 'hoursminutesseconds',
								type: 'temporal',
							},
							x: {
								aggregate: 'min',
								field: 'timestamp',
								type: 'temporal',
							},
							y: {
								aggregate: 'min',
								field: 'value',
								scale: {
									zero: false,
								},
								type: 'quantitative',
							},
						},
						transform: [
							{
								filter: {
									param: 'param_11',
								},
							},
						],
					},
					{
						mark: {
							type: 'text',
							color: 'firebrick',
							dx: 20,
							dy: -10,
							size: 14,
						},
						encoding: {
							text: {
								aggregate: 'max',
								field: 'timestamp',
								formatType: 'time',
								timeUnit: 'hoursminutesseconds',
								type: 'temporal',
							},
							x: {
								aggregate: 'max',
								field: 'timestamp',
								type: 'temporal',
							},
							y: {
								aggregate: 'min',
								field: 'value',
								scale: {
									zero: false,
								},
								type: 'quantitative',
							},
						},
						transform: [
							{
								filter: {
									param: 'param_11',
								},
							},
						],
					},
				],
				height: 200,
				width: 800,
			},
			params: [
				{
					name: 'param_11',
					select: {
						type: 'interval',
						encodings: ['x'],
					},
					views: ['view_11'],
				},
			],
			resolve: {
				scale: {
					x: 'independent',
					y: 'independent',
				},
			},
			spacing: 25,
			$schema: 'https://vega.github.io/schema/vega-lite/v5.20.1.json',
		};
		const vegaContainer = document.getElementById('vega-container');
		if (vegaContainer) {
			vegaEmbed('#vega-container', spec).catch(console.error);
		} else {
			console.warn(
				'[WARNING] #vega-container element is missing. Skipping chart rendering.',
			);
		}
	} else {
		chartContainer.innerHTML =
			'<p>No recordMesgs data available for chart.</p>';
	}
}
