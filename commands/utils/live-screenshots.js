const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, extractNameFromURL } = require('../../helpers.js');

const COOL_DDOWN = 30;
const DEFAULT_COMPLETION_MESSAGE = 'Recent NMS Waves Screenshots:';
module.exports = {
	cooldown: COOL_DDOWN,
	data: new SlashCommandBuilder()
		.setName('live-screenshots')
		.setDescription('Posts generated screenshots if they exist with live updates.')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to reply at. defaults to current channel.')
		)
		.addStringOption( option => 
			option.setName('on-completion')
			.setDescription('Set custom completion message.')
		)
		.addBooleanOption(option =>
			option.setName('visible-only-to-me')
			.setDescription('Set the bots message visibility to yourself alone.')
		),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: interaction.options.getBoolean('visible-only-to-me')});

		let imageAttachments = [
			{attachment: 'https://gotlegends.info/nms-order/r2s-full', name: 'r2s-full.png' },
			{attachment: 'https://gotlegends.info/nms-order/r2s-truncated', name: 'r2s-truncated.png' },
			{attachment: 'https://gotlegends.info/nms-order/oms-light', name: 'oms-light.png' },
			{attachment: 'https://gotlegends.info/nms-order/oms-dark', name: 'oms-dark.png' },
			{attachment: 'https://gotlegends.info/nms-order/r2s-tabular', name: 'r2s-tabular.png' },
	
		];
		console.log('Sending live screenshots...');
		if(interaction.options.getString('on-completion')){
			await interaction.deleteReply();
			if(interaction.options.getChannel('channel')){
				interaction.options.getChannel('channel').send({content: interaction.options.getString('on-completion'), files: imageAttachments});
			}else{
				await interaction.channel.send({content: interaction.options.getString('on-completion'), files: imageAttachments});
			}
		}else{
			await interaction.deleteReply();
			if(interaction.options.getChannel('channel')){
				interaction.options.getChannel('channel').send({content: DEF2AULT_COMPLETION_MESSAGE, files: imageAttachments});
			}else{
				await interaction.channel.send({content: DEFAULT_COMPLETION_MESSAGE, files: imageAttachments});
			}
		}
		console.log('\n----------------Screenshots sent.')
	},
};