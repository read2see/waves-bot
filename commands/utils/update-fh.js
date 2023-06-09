const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, prepareData, postData, getApiData, extractNameFromURL, countdown,
     constructErrorMessage} = require('../../helpers.js');

const delay = 60000;
const COOL_DDOWN = 45;
const totalMessagesToFetch = 20;
const DEFAULT_FLAG = '!waves';
const DEFAULT_COMPLETION_MESSAGE = 'NMS Waves Screenshots:';

module.exports = {
    cooldown: COOL_DDOWN ,
	data: new SlashCommandBuilder()
		.setName('update-fh')
		.setDescription(`Update with flagged[${DEFAULT_FLAG}] messages, screenshots, and posting.`)
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
        )
        .addStringOption( option => 
            option.setName('flag')
            .setDescription(`Set a custom flag to track, default is [${DEFAULT_FLAG}].`)
        )
        .addStringOption(option =>
			option.setName('waves')
				.setDescription('The weekly waves raw text.')
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
        .addIntegerOption(option =>
            option.setName('history-amount')
            .setDescription('Set the amount of recent messages to filter through, default [20], maximum [50].')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50)
        )
    ,
	async execute(interaction) {
    
        await interaction.deferReply({ephemeral: interaction.options.getBoolean('visible-only-to-me')});

        const botUser = interaction.client.user;
        if(interaction.options.getInteger('delete-last-post')){
            (await interaction.channel.messages.fetch({ limit: 20 })).filter(m => m.author.id === botUser.id).first().delete();
        }
        
        const waves = await interaction.options.getString('waves');

        let message = null;

        if(!waves){

            const customAmount = interaction.options.getInteger('history-messages-amount');
            let messages = null;
            if(customAmount){
                console.log(`Fetching recent ${customAmount} messages...`);
                messages = await interaction.channel.messages.fetch({ limit: customAmount });
            }else{
                console.log(`Fetching recent ${totalMessagesToFetch} messages...`);
                messages = await interaction.channel.messages.fetch({ limit: totalMessagesToFetch });
            }

            let currentFlag = null;
            if(interaction.options.getString('flag')){
                currentFlag = interaction.options.getString('flag');
            }else{
                currentFlag = DEFAULT_FLAG;
            }

            try{
                message = messages.filter(m => m.content.includes(currentFlag)).sort((msgA, msgB) =>  msgB.createdTimestamp - msgA.createdTimestamp).first().content;
            }catch(error){
                console.log(error);
                interaction.user.send(`Could not find any waves messages with flag ${currentFlag}, or the message may be incomplete.`);
                return
            }
            
            if(!message || !message.includes(currentFlag) || message.length === currentFlag.length || message.length < 300){
                interaction.user.send(`Could not find any waves messages with flag ${currentFlag}, or the message may be incomplete.`);
                return
            }
        }else{

            message = waves;

        }

        console.log("Preparing data to be sent...");

        const apiData = await getApiData(api_secret);
        let data = prepareData(message, apiData);
        
        if(data.errors){
            await interaction.deleteReply();
            const errorMessage = "Some data are invalid:\n"+constructErrorMessage(data.errors);
            interaction.user.send(errorMessage);
            console.log(errorMessage);
        } else {
            let response = await postData(data, api_secret, "\nSending POST request to submit the new updates and generating the screenshots......");
            await interaction.editReply({content:`Generating screenshots ETA ${delay/1000}s.`, ephemeral: interaction.options.getBoolean('visible-only-to-me')});

            if(!response.ok){
                await interaction.deleteReply();
                interaction.user.send(`Request failed. Server response: ${response.status} | ${response.statusText} , something went wrong somewhere try again after 120s.`)
            }else{
                countdown('Time Remaining before sending screenshots', delay-3000);

                setTimeout( async () => {

                    try {
                        const generatedLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', api_secret, '\nFetching generated screenshots...');

                        let linksMessage = "";
                        let imageAttachments = [];
                        if(generatedLinks){
                            const exclusions = [
                                await interaction.options.getString('exception-1'),
                                await interaction.options.getString('exception-2'),
                                await interaction.options.getString('exception-3'),
                            ]
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
                        console.error(`Failed to send images to ${interaction.channel.name}: ${error}`);
                        interaction.user.send(`Failed to send images to ${interaction.channel.name}.`);
                    }
                },
                delay
                )
            }
        }
       
	},
};

// async function downloadImages(urls, secret){
//     const images = [];

//     urls.forEach(async (url) => {
//        try{
//             const imageBlob = await fetchBlob(url, secret);
//             const imageAttachment = {attachment: imageBlob, name: extractNameFromURL(url)};
//             images.push(imageAttachment);
//        }catch(error){
//             console.log(`Failed to download image from ${url}`);
//        }
//     })

//     return images;
// }
// function extractNameFromURL(url){
//     const urlParts = url.split('/');
//     const fileName = urlParts[urlParts.length - 1]//.split('.')[0];
//     return fileName;
// }
// async function getMapId(message) {
//     const staticMaps = [
//         {
//             id: 1 ,
//             title: 'The Shores of Vengeance'
//         },
//         {
//             id: 2 ,
//             title: 'The Defense of Aoi Village'
//         },
//         {
//             id: 3 ,
//             title: 'The Shadows of War'
//         },
//         {
//             id: 4 ,
//             title: 'Blood in the Snow'
//         },
//         {
//             id: 5 ,
//             title: 'Twilight and Ashes'
//         },
//         {
//             id: 6 ,
//             title: 'Blood and Steel'
//         },
//     ];
//     const maps = await fetchResource('https://gotlegends.info/bot/nms-order/maps', secret);
//     let map_id = -1;
//     for (let i = 0; i < maps.length; i++) {
//         if (message.toLowerCase().includes(maps[i].title.toLowerCase())) {
//             map_id = maps[i].id;
//             break;
//         }
//     }
//     return map_id;
// }

// async function getModifier(message) {
//     const staticModifiers = [
//         {
//             id:1,
//             title: 'Slowed Revives'
//         },
//         {
//             id:3,
//             title: 'Tool Shortage'
//         },
//         {
//             id: 4,
//             title: 'Immunity'
//         },
//         {
//             id: 9,
//             title: 'Reduced Healing'
//         },
//         {
//             id: 10,
//             title: 'Empowered Foes'
//         },
//         {
//             id: 11,
//             title: 'Incapacitated'
//         },
//         {
//             id: 12,
//             title: 'Barbed Arrows'
//         }
//     ];
//     const modifiers = await fetchResource('https://gotlegends.info/bot/nms-order/mods', secret);
//     let mod_id = -1;
//     for (let i = 0; i < modifiers.length; i++) {
//         let regex = new RegExp(`${modifiers[i].title} | ${modifiers[i].title.slice(0, 5)}`, 'gim');
//         if (message.search(regex) > -1) {
//             mod_id = modifiers[i].id;
//             return mod_id;
//         }
//     }
//     return mod_id;
// }

// async function getHazard(message) {
//     const staticHazards = [
//         {
//             id: 13,
//             title: 'Fire Spirits'
//         },
//         {
//             id: 14,
//             title: 'Eyes of Iyo'
//         },
//         {
//             id: 15,
//             title: 'Disciples Of Iyo'
//         },
//     ];
//     const hazards = await fetchResource('https://gotlegends.info/bot/nms-order/hazards', secret);
//     let hazard_id = -1;
//     for (let i = 0; i < hazards.length; i++) {
//         let regex = new RegExp(`${hazards[i].title} | ${hazards[i].title.slice(0, 5)}`, 'gim');
//         if (message.search(regex) > -1) {
//             hazard_id = hazards[i].id;
//             return hazard_id;
//         }
//     }
//     return hazard_id;
// }

// function getWeek(message) {
//     let hits = message.match(/week \d+|week\d+/gim);
//     let currentWeek = 1;
//     if (hits && hits[0]) {
//         let matchedWeek = parseInt(hits[0].split(' ')[1]);
//         if (matchedWeek < 9) {
//             currentWeek = matchedWeek;
//             return currentWeek;
//         }
//     }
//     return currentWeek
// }

// function getZones(message){
//     let zones = '';
//     let lines = message.replace(/\(Middle\)/gim, "M");
//         lines = lines.replace(/\(Right\)/gim, "R");
//         lines = lines.replace(/\(Left\)/gim, "L");
//         lines = lines.replace(/\(Deep\)/gim, "D");
//         lines = lines.replace(/\(Lighthouse\)/gim, "LH");
//         lines = lines.replace(/\(Ledge\)/gim, "Ledge");
//         lines = lines.split('\n');
//         let startingIndex = -1;
//         for (let i = 0; i < lines.length; i++) {
//             if (lines[i].includes(',')) {
//                 startingIndex = i;
//                 break;
//             }
//         }

//         if (startingIndex != -1) {
//             for (let i = startingIndex; i <= startingIndex + 14; i++) {
//                 lines[i] = lines[i].replace(/[\d.]+|\([\s\w\/]*\)/gim, '');
//                 if (i == startingIndex + 14) {
//                     zones += lines[i].trim();
//                 } else {
//                     zones += lines[i].trim() + '\n';
//                 }
//             }

//             if(zones.split('\n').join(',').split(',').length != 45){
//                 return -1;
//             }
//         }
//     return zones;
// }

// function getCredits(message){
//     let credits = "";
//     let lines = message;
//     lines = lines.split('\n');
//     if (lines[lines.length - 1].toLowerCase().includes('credits')) {
//         credits = lines[lines.length - 1].replace(/&|:/, '').trim().replace(/credits/i, '').trim();
//         return credits;
//     }
//     return credits;
// }

// async function prepareData(message){    
//     let data = {
//         username: 'waves-bot',
//         map_id: await getMapId(message),
//         week: getWeek(message),
//         modifier_id: await getModifier(message),
//         hazard_id: await getHazard(message),
//         zones: getZones(message),
//         credits: getCredits(message),
//         version: 2.18
//     };


//     return validateData(data);
// }

// function validateData(data){
//     let validatedData = data;
//     let errors = [];

//     if(data.map_id === -1){
//        errors.push({dataItem: 'map_id', cause: 'Check and correct map title.'});
//     }

//     if(data.week < 1 || data.week > 9){
//         errors.push({dataItem: 'week', cause: 'Check that the week is in the range 1-8.'});
//     }

//     if(data.modifier_id === -1){
//         errors.push({dataItem: 'modifier', cause: 'Check and correct weekly modifier.'});
//     }

//     if(data.hazard_id === -1){
//         errors.push({dataItem: 'hazard', cause: 'Check and correct weekly hazard.'});
//     }

//     if(data.zones === -1){
//         errors.push({dataItem: 'zones', cause: 'Check zones, some may be missing or the matching process may have failed to match your format.'});
//     }

//     if(errors.length > 0){
//        validatedData.errors = errors;
//     }
//     return validatedData;
// }

// async function postData(data, secret){
//     let staticTestingData = { 
//         username: 'waves-bot',
//         map_id: 5,
//         week: 7,
//         modifier: 11,
//         hazard: 15,
//         zones: `Boulder , Cliff LH, Obelisk
//         Side, Obelisk, Boulder
//         Boulder LH, Side, Obelisk
//         Boulder , Cliff LH, Obelisk
//         Side, Obelisk, Side
//         Obelisk, Cliff , Side
//         Boulder LH, Side, Obelisk
//         Cliff , Side, Boulder
//         Boulder LH, Cliff , Boulder
//         Obelisk, Cliff , Boulder
//         Boulder LH, Obelisk, Obelisk
//         Boulder , Cliff LH, Obelisk
//         Obelisk, Obelisk, Boulder
//         Obelisk, Side, Cliff LH
//         Obelisk, Cliff LH, Boulder LH`,
//         credits: "AfunNightmare",
//         version: 2.18
//     };
//     let response = await fetch('https://gotlegends.info/bot/nms-order/create', {
//         method:'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer '+secret
//         },
//         body: JSON.stringify(data)
//     });
//     console.log(`Post Status: ${response.status}`)
//     return response;
// }

// function constructErrorMessage(errors){
//     let message = "";

//     errors.forEach(er => {
//         message = message.concat(`${er.dataItem}: ${er.cause}\n`);
//     });

//     return message;
// }

// async function fetchResource(url, secret){
//     const response = await fetch(url, {headers: {'Authorization': 'Bearer '+secret}});
//     const data = await response.json()
//     return data;
// }

// async function fetchBlob(url, secret){
//     const response = await fetch(url, {headers: {'Authorization': 'Bearer '+secret}});
//     const blob = await response.blob()
//     return blob;
// }

// function countdown(message, time) {
//     let countdownTimer = setInterval(function() {
//       process.stdout.write(`\r${message}: ` + (time / 1000) + 's   ');
//       time = time - 1000;
  
//       if (time < 0) {
//         clearInterval(countdownTimer);
//         console.log("");
//       }
//     }, 1000);
//   }



  
  
  
  