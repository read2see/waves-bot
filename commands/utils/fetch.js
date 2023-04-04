const { SlashCommandBuilder, Mes } = require('discord.js');

const delay = 120000;
const secret = '3T&^jSzkSBQSyGzNbgmPtE7zzvk%usreA%MN&7fZ%tCgH!iTKWzqh29YucQfjLUA';
const flag = '!order';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('screenshots')
		.setDescription('Submit update and generate then post screenshots.'),
	async execute(interaction) {
        const generatedLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', secret);
        const initiator = interaction.user;
        const channel = interaction.channel
        const messages = await channel.messages.fetch({limit:15});
        const message = messages.filter(m => m.content.startsWith(flag)).first();
        if(!message){
            await interaction.reply(`Could not find any order messages with flag !order.`);
            return
        }
        let data = await prepareData(message.content);

        if(data.errors){
            let errorMessage = "Some data are invalid:\n"+constructErrorMessage(data.errors);
            initiator.send(errorMessage);
            console.log(errorMessage);
        }else{
            let response = await postData(data, secret);
            if(!response.ok){
                initiator.send(`Request failed. Server response: ${response.status} | ${response.statusText} , something went wrong somewhere try again after 120s.`)
                console.log(`Response Status: ${response.status}| ${response.statusText}`);
            }else{
                console.log('Request was sent successfully.');
 
                countdown(delay-3000);
                setTimeout( async () => {
                    try {
                        let links = "";
                        Object.values(generatedLinks).forEach( async (link,index) => {
                            let fullURL = 'https://gotlegends.info'+link;
                            links = links.concat(fullURL+"\n");
                        })
                        channel.send(links);
                        console.log('\n----------------Screenshots sent.')
                    } catch (error) {
                        console.error(`Failed to send images to ${channel.name}: ${error}`);
                        await interaction.reply(`Failed to send images to ${channel.name}.`);
                    }
                },
                delay
                )
            }
        }
        await interaction.reply(`Generating screenshots ETA ${delay/1000}s.`);
	},
};

async function prepareData(message){    
    let data = {
        username: 'discordBot',
        map_id: await getMapId(message),
        week: getWeek(message),
        modifier: await getModifier(message),
        hazard: await getHazard(message),
        zones: getZones(message),
        credits: getCredits(message),
        version: 2.18
    };


    return validateData(data);
}

async function postData(data, secret){
    let staticTestingData = { 
        username: 'discordBot',
        map_id: 5,
        week: 7,
        modifier: 11,
        hazard: 15,
        zones: `Boulder , Cliff LH, Obelisk
        Side, Obelisk, Boulder
        Boulder LH, Side, Obelisk
        Boulder , Cliff LH, Obelisk
        Side, Obelisk, Side
        Obelisk, Cliff , Side
        Boulder LH, Side, Obelisk
        Cliff , Side, Boulder
        Boulder LH, Cliff , Boulder
        Obelisk, Cliff , Boulder
        Boulder LH, Obelisk, Obelisk
        Boulder , Cliff LH, Obelisk
        Obelisk, Obelisk, Boulder
        Obelisk, Side, Cliff LH
        Obelisk, Cliff LH, Boulder LH`,
        credits: "AfunNightmare",
        version: 2.18
    };
    let response = await fetch('https://gotlegends.info/bot/nms-order/create', {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+secret
        },
        body: JSON.stringify(data)
    });
    console.log(`Post Status: ${response.status}`)
    return response;
}

async function getMapId(message) {
    const staticMaps = [
        {
            id: 1 ,
            title: 'The Shores of Vengeance'
        },
        {
            id: 2 ,
            title: 'The Defense of Aoi Village'
        },
        {
            id: 3 ,
            title: 'The Shadows of War'
        },
        {
            id: 4 ,
            title: 'Blood in the Snow'
        },
        {
            id: 5 ,
            title: 'Twilight and Ashes'
        },
        {
            id: 6 ,
            title: 'Blood and Steel'
        },
    ];
    const maps = await fetchResource('https://gotlegends.info/bot/nms-order/maps', secret);
    let map_id = -1;
    for (let i = 0; i < maps.length; i++) {
        if (message.toLowerCase().includes(maps[i].title.toLowerCase())) {
            map_id = maps[i].id;
            break;
        }
    }
    return map_id;
}

async function getModifier(message) {
    const staticModifiers = [
        {
            id:1,
            title: 'Slowed Revives'
        },
        {
            id:3,
            title: 'Tool Shortage'
        },
        {
            id: 4,
            title: 'Immunity'
        },
        {
            id: 9,
            title: 'Reduced Healing'
        },
        {
            id: 10,
            title: 'Empowered Foes'
        },
        {
            id: 11,
            title: 'Incapacitated'
        },
        {
            id: 12,
            title: 'Barbed Arrows'
        }
    ];
    const modifiers = await fetchResource('https://gotlegends.info/bot/nms-order/mods', secret);
    let mod_id = -1;
    for (let i = 0; i < modifiers.length; i++) {
        let regex = new RegExp(`${modifiers[i].title} | ${modifiers[i].title.slice(0, 5)}`, 'gim');
        if (message.search(regex) > -1) {
            mod_id = modifiers[i].id;
            return mod_id;
        }
    }
    return mod_id;
}

async function getHazard(message) {
    const staticHazards = [
        {
            id: 13,
            title: 'Fire Spirits'
        },
        {
            id: 14,
            title: 'Eyes of Iyo'
        },
        {
            id: 15,
            title: 'Disciples Of Iyo'
        },
    ];
    const hazards = await fetchResource('https://gotlegends.info/bot/nms-order/hazards', secret);
    let hazard_id = -1;
    for (let i = 0; i < hazards.length; i++) {
        let regex = new RegExp(`${hazards[i].title} | ${hazards[i].title.slice(0, 5)}`, 'gim');
        if (message.search(regex) > -1) {
            hazard_id = hazards[i].id;
            return hazard_id;
        }
    }
    return hazard_id;
}

function getWeek(message) {
    let hits = message.match(/week \d+|week\d+/gim);
    let currentWeek = 1;
    if (hits && hits[0]) {
        let matchedWeek = parseInt(hits[0].split(' ')[1]);
        if (matchedWeek < 9) {
            currentWeek = matchedWeek;
            return currentWeek;
        }
    }
    return currentWeek
}

function getZones(message){
    let zones = '';
    let lines = message.replace(/\(Middle\)/gim, "M");
        lines = lines.replace(/\(Right\)/gim, "R");
        lines = lines.replace(/\(Left\)/gim, "L");
        lines = lines.replace(/\(Deep\)/gim, "D");
        lines = lines.replace(/\(Lighthouse\)/gim, "LH");
        lines = lines.replace(/\(Ledge\)/gim, "Ledge");
        lines = lines.split('\n');
        let startingIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(',')) {
                startingIndex = i;
                break;
            }
        }

        if (startingIndex != -1) {
            for (let i = startingIndex; i <= startingIndex + 14; i++) {
                lines[i] = lines[i].replace(/[\d.]+|\([\s\w\/]*\)/gim, '');
                if (i == startingIndex + 14) {
                    zones += lines[i].trim();
                } else {
                    zones += lines[i].trim() + '\n';
                }
            }

            if(zones.split('\n').join(',').split(',').length != 45){
                return -1;
            }
        }
    return zones;
}

function getCredits(message){
    let credits = "";
    let lines = message;
    lines = lines.split('\n');
    if (lines[lines.length - 1].toLowerCase().includes('credits')) {
        credits = lines[lines.length - 1].replace(/&|:/, '').trim().replace(/credits/i, '').trim();
        return credits;
    }
    return credits;
}

function validateData(data){
    let validatedData = data;
    let errors = [];

    if(data.map_id === -1){
       errors.push({dataItem: 'map_id', cause: 'Check and correct map title.'});
    }

    if(data.week < 1 || data.week > 9){
        errors.push({dataItem: 'week', cause: 'Check that the week is in the range 1-8.'});
    }

    if(data.modifier === -1){
        errors.push({dataItem: 'modifier', cause: 'Check and correct weekly modifier.'});
    }

    if(data.modifier === -1){
        errors.push({dataItem: 'hazard', cause: 'Check and correct weekly hazard.'});
    }

    if(data.zones === -1){
        errors.push({dataItem: 'zones', cause: 'Check zones, some may be missing or the matching process may have failed to match your format.'});
    }

    if(errors.length > 0){
       validatedData.errors = errors;
    }
    return validatedData;
}

function constructErrorMessage(errors){
    let message = "";

    errors.forEach(er => {
        message = message.concat(`${er.dataItem}: ${er.cause}\n`);
    });

    return message;
}

async function fetchResource(url, secret){
    const response = await fetch(url, {headers: {'Authorization': 'Bearer '+secret}});
    const data = await response.json()
    return data;
}

  
function countdown(time) {
    let countdownTimer = setInterval(function() {
      process.stdout.write('\rTime Remaining before sending screenshots: ' + (time / 1000) + 's   ');
      time = time - 1000;
  
      if (time < 0) {
        clearInterval(countdownTimer);
        console.log("");
      }
    }, 1000);
  }
  
  
  