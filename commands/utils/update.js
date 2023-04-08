const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { formatRawZones, fetchResource, extractNameFromURL, countdown, postData } = require('../../helpers.js');

const delay = 60000;
const COOL_DDOWN = 45;
const DEFAULT_COMPLETION_MESSAGE = 'NMS Waves Screenshots:';

module.exports = {
	cooldown: COOL_DDOWN ,
	data: new SlashCommandBuilder()
			.setName('update')
			.setDescription('Update using the message that initiated the command for data input.')
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
				.setDescription('Set the bot\'s message visibility to yourself alone.')
			)
			.addIntegerOption(option =>
				option.setName('week')
					.setDescription('Current week.')
					.setRequired(true)
					.addChoices(
						{name: '1', value: 1},
						{name: '2', value: 2},
						{name: '3', value: 3},
						{name: '4', value: 4},
						{name: '5', value: 5},
						{name: '6', value: 6},
						{name: '7', value: 7},
						{name: '8', value: 8},
						)
				)
			.addIntegerOption( option => 
				option.setName('title')
					.setDescription('Map title.')
					.setRequired(true)
					.addChoices(
						{name: 'The Shores of Vengeance', value: 1 },
						{name: 'The Defense of Aoi Village', value: 2 },
						{name: 'The Shadows of War', value: 3 },
						{name: 'Blood in the Snow', value: 4 },
						{name: 'Twilight and Ashes', value: 5 },
						{name: 'Blood and Steel', value: 6 },
					)
				)
			.addIntegerOption(option => 
				option.setName('modifier')
					.setDescription('Weekly modifier.')
					.setRequired(true)
					.addChoices(
						{name: 'Slowed Revives', value: 1 },
						{name: 'Tool Shortage', value: 3 },
						{name: 'Immunity', value: 4 },
						{name: 'Reduced Healing', value: 9 },
						{name: 'Empowered Foes', value: 10 },
						{name: 'Incapicitated', value: 11 },
						{name: 'Barbed Arrows', value: 12 },
					 )
				)
			.addIntegerOption(option => 
				option.setName('hazard')
					.setDescription('Weekly hazard.')
					.setRequired(true)
					.addChoices( 
						{name: 'Fire Spirits', value: 13 },
						{name: 'Eyes of Iyo', value: 14 },
						{name: 'Disciples Of Iyo', value: 15 },
					 )
				)
			.addStringOption(option => 
				option.setName('zones')
					.setDescription('The zones in order.')
					.setRequired(true)
				)
			.addStringOption(option => 
				option.setName('credits')
					.setDescription('Players that took the time to note it down.')
				)
			.addNumberOption(option => 
				option.setName('version')
					.setDescription('Game version.')
				)
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
				.setDescription('Set the bot\'s message visibility to yourself alone.')
			)
			.addStringOption( option => 
			option.setName('exception-1')
			.setDescription('Choose a screenshot to exclude.')
			.addChoices(
				{name: 'infograph', value: 'infograph.png'},
				{name: 'infograph-nf', value: '-nofooter.png'},
				{name: 'table', value: 'table'},
				{name: 'omv-d', value: 'omv-d'},
				{name: 'omv-l', value: 'omv-l'},
			)
		)
		.addStringOption( option => 
			option.setName('exception-2')
			.setDescription('Choose a 2nd screenshot to exclude.')
			.addChoices(
				{name: 'infograph', value: 'infograph.png'},
				{name: 'infograph-nf', value: '-nofooter.png'},
				{name: 'table', value: 'table'},
				{name: 'omv-d', value: 'omv-d'},
				{name: 'omv-l', value: 'omv-l'},
			)
		)
		.addStringOption( option => 
			option.setName('exception-3')
			.setDescription('Choose a 3rd screenshot to exclude.')
			.addChoices(
				{name: 'infograph', value: 'infograph.png'},
				{name: 'infograph-nf', value: '-nofooter.png'},
				{name: 'table', value: 'table'},
				{name: 'omv-d', value: 'omv-d'},
				{name: 'omv-l', value: 'omv-l'},
			)
		)
		.addBooleanOption(option =>
            option.setName('delete-last-post')
            .setDescription('Deletes latest bot post if the user is attempting to correct generated screenshots.')
        )
		,

	async execute(interaction) {

		await interaction.deferReply({ephemeral: interaction.options.getBoolean('visible-only-to-me')});
		
		const botUser = interaction.client.user;
        if(interaction.options.getBoolean('delete-last-post')){
            (await interaction.channel.messages.fetch({ limit: 20 })).filter(m => m.author.id === botUser.id).first().delete();
        }
		

		console.log("Preparing data to be sent...");
		let data = {
			username: 'waves-bot',
			week: await interaction.options.getInteger('week'),
			map_id: await interaction.options.getInteger('title'),
			modifier_id: await interaction.options.getInteger('modifier'),
			hazard_id: await interaction.options.getInteger('hazard'),
			zones: formatRawZones(await interaction.options.getString('zones')),
			credits: await interaction.options.getString('credits'),
			version: await interaction.options.getNumber('version')
		}
		
		console.log("Sending request...");
		if(data.zones.split('\n').join(',').split(',').length < 44){
			await interaction.deleteReply();
			interaction.user.send(`Oni lord tracked me and something went wrong. Only tracked ${data.zones.split('\n').join(',').split(',').length} zones.
						\nMissing some zones, the matching process may have failed to catch your format, double check your inputs and try again.`);
			console.log(`Zones came up short ${data.zones.split('\n').join(',').split(',').length} < ${44}.`);
			return
		}

        let response = await postData(data, api_secret);
		await interaction.editReply({content:`Generating screenshots ETA ${delay/1000}s.`});

		if(!response.ok){
			await interaction.deleteReply();
			interaction.user.send(`Request failed. Server response: ${response.status} | ${response.statusText} , something went wrong somewhere try again after 120s.`)
			console.log(`Response Status: ${response.status}| ${response.statusText}`);
		}else{

			console.log('Request was sent successfully.');
			countdown('Time Remaining before sending screenshots', delay-3000);

			setTimeout( async () => {

				try {
					const generatedLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', api_secret);
					let linksMessage = "";
					let imageAttachments = [];
					if(generatedLinks){
						const exclusions = [
							await interaction.options.getString('exception-1'),
							await interaction.options.getString('exception-2'),
							await interaction.options.getString('exception-3'),
						]
						console.log(`Exclude ${exclusions}`);
						Object.values(generatedLinks).filter(screenshot => !screenshot.includes(exclusions[0]) && !screenshot.includes(exclusions[1]) && !screenshot.includes(exclusions[2])).forEach( async (link,index) => {
							let fullURL = 'https://gotlegends.info'+link;
							linksMessage = linksMessage.concat(fullURL+"\n");
							imageAttachments.push({attachment: fullURL, name: extractNameFromURL(fullURL)});
						})

						if(interaction.options.getString('on-completion')){
							if(interaction.options.getChannel('channel')){
								await interaction.deleteReply();
								interaction.options.getChannel('channel').send({content: interaction.options.getString('on-completion'), files: imageAttachments});
							}else{
								await interaction.editReply({content: interaction.options.getString('on-completion'), files: imageAttachments});
							}
						}else{
							if(interaction.options.getChannel('channel')){
								await interaction.deleteReply();
								interaction.options.getChannel('channel').send({content: DEFAULT_COMPLETION_MESSAGE, files: imageAttachments});
							}else{
								await interaction.editReply({content: DEFAULT_COMPLETION_MESSAGE, files: imageAttachments});
							}
						}
						
						console.log('\n----------------Screenshots sent.')
					}
				} catch (error) {
					await interaction.deleteReply();
					console.error(`Failed to send images to ${channel.name}: ${error}`);
					interaction.user.send(`Failed to send images to ${channel.name}.`);

				}

			},
			delay
			)
		}

	},
};

// Auto assign choices, requires command deployment to be async and all commands data to be refactored to a function
// data: async () => {		
// 	const apiData = await getApiData(api_secret);
// 	return new SlashCommandBuilder()
// 		.setName('update-deprecated')
// 		.setDescription('Update using the message that initiated the command for data input.')
// 		.addIntegerOption(option =>
// 			option.setName('week')
// 				.setDescription('Current week.')
// 				.setRequired(true)
// 				.addChoices(
// 					{name: '1', value: 1},
// 					{name: '2', value: 2},
// 					{name: '3', value: 3},
// 					{name: '4', value: 4},
// 					{name: '5', value: 5},
// 					{name: '6', value: 6},
// 					{name: '7', value: 7},
// 					{name: '8', value: 8},
// 					)
// 			)
// 		.addIntegerOption( option => 
// 			option.setName('title')
// 				.setDescription('Map title.')
// 				.setRequired(true)
// 				.addChoices( ...apiData.maps.map((object =>{ return {name: object.title, value: object.id}})))
// 			)
// 		.addIntegerOption(option => 
// 			option.setName('modifier')
// 				.setDescription('Weekly modifier.')
// 				.setRequired(true)
// 				.addChoices( ...apiData.modifiers.map((object =>{ return {name: object.title, value: object.id}})) )
// 			)
// 		.addIntegerOption(option => 
// 			option.setName('hazard')
// 				.setDescription('Weekly hazard.')
// 				.setRequired(true)
// 				.addChoices( ...apiData.hazards.map((object =>{ return {name: object.title, value: object.id}})) )
// 			)
// 		.addStringOption(option => 
// 			option.setName('zones')
// 				.setDescription('The zones in order.')
// 				.setRequired(true)
// 			)
// 		.addStringOption(option => 
// 			option.setName('credits')
// 				.setDescription('Players that took the time to note it down.')
// 			)
// }