
function extractNameFromURL(url){
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1]//.split('.')[0];
    return fileName;
}

function getMapId(message, maps) {
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
    let map_id = -1;
    for (let i = 0; i < maps.length; i++) {
        if (message.toLowerCase().includes(maps[i].title.toLowerCase())) {
            map_id = maps[i].id;
            break;
        }
    }
    return map_id;
}

function getModifier(message, modifiers) {
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

function getHazard(message, hazards) {
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
    let hazard_id = -1;
    for (let i = 0; i < hazards.length; i++) {
        let regex = new RegExp(`${hazards[i].title} | ${hazards[i].title.slice(0, 5)}`, 'gim');
        if (message.search(regex) > -1) {
            hazard_id = hazards[i].id;
            return hazard_id;
        }else{
            hazard_id = 13
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
    let lines = message.replace(/\(Middle\)/gim, "M")
        .replace(/\(Right\)/gim, "R")
        .replace(/\(Left\)/gim, "L")
        .replace(/\(Deep\)/gim, "D")
        .replace(/\(Lighthouse\)/gim, "LH")
        .replace(/\(Ledge\)/gim, "Ledge")
        .split('\n');

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

function formatRawZones(rawZones){

    let waves = rawZones.replace(/\(Middle\)/gim, "M")
    .replace(/\(Right\)/gim, "R")
    .replace(/\(Left\)/gim, "L")
    .replace(/\(Deep\)/gim, "D")
    .replace(/\(Lighthouse\)/gim, "LH")
    .replace(/\(Ledge\)/gim, "Ledge")
    .split(/\d\./g);
    waves = waves.filter(wave => wave.length > 10 && wave.split(',').length >= 3).map(wave => wave.trim());

    if(waves.length != 15){
        console.log("Could not match zones, unrecognized format for the matching algorithm detected.")
    }

    if(waves[14].split(',').length > 3){
        const finalWave = waves[14].split(',');
        lastZone = finalWave[2].trim().split(/\s+/);
        lastZone.pop();
        lastZone = lastZone.join(' ');
        let finalWaveZones = [finalWave[0], finalWave[1], lastZone];
        waves[14] = finalWaveZones.join(', ').trim();
    }

    let zones = '';
    for (let i = 0; i < waves.length; i++) {
        waves[i] = waves[i].replace(/[\d.]+|\([\s\w\/]*\)/gim, '');
        if (i === waves.length - 1) {
            zones += waves[i].trim();
        } else {
            zones += waves[i].trim() + '\n';
        }
    }
    zones = zones.replace(/credits/gim, '');
    return zones;
}

function getCredits(message){
    let credits = "";
    let lines = message;
    lines = lines.split('\n');
    if (lines[lines.length - 1].toLowerCase().includes('credits') && lines[lines.length - 1].length < 150 ) {
        credits = lines[lines.length - 1].replace(/&|:/, '').trim().replace(/credits/i, '').trim();
        
        return credits;
    }else{
        let waves = message.split(/\d\./g);
        let credits = waves[waves.length - 1];
        credits = credits.trim().split(',');
        credits.splice(0, 2);
        let firstPlayer = credits[0].trim().split(' ').pop();
        credits.shift();
        credits = [firstPlayer, credits].join(', ').trim();

        return credits;
    }
}

function getGameVersion(message){
    // Not implemented
    console.log('getGameVersion() is not implemented yet.');
    return false;
}

function prepareData(message, apiData){    
    let data = {
        username: 'waves-bot',
        map_id: getMapId(message, apiData.maps),
        week: getWeek(message),
        modifier_id: getModifier(message, apiData.modifiers),
        hazard_id: getHazard(message, apiData.hazards),
        zones: formatRawZones(message),
        credits: getCredits(message),
        version: 2.18
    };


    return validateData(data);
}

function prepDataFromRawText(message, apiData){
   
    // let data = {
    //     username: 'waves-bot',
    //     map_id: getMapId(message, apiData.maps),
    //     week: getWeek(message),
    //     modifier_id: getModifier(message, apiData.modifiers),
    //     hazard_id: getHazard(message, apiData.hazards),
    //     zones: getZonesFromRawText(message),
    //     credits: getCreditsFromRawText(message),
    //     version: 2.18
    // };


    return validateData(data);
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

    if(data.modifier_id === -1){
        errors.push({dataItem: 'modifier', cause: 'Check and correct weekly modifier.'});
    }

    if(data.hazard_id === -1){
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

async function postData(data, secret, optionalLog = null){

    if(optionalLog){
        console.log(optionalLog);
    }

    let staticTestingData = { 
        username: 'waves-bot',
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
    if(response.status != 200){
        console.log(`Responded with ${response.status} : ${response.statusText}\n`);
        return;
    }
    console.log(`Post Status: ${response.status}`)
    console.log('Request was sent successfully.');
    return response;
}

function constructErrorMessage(errors){
    let message = "";

    errors.forEach(er => {
        message = message.concat(`${er.dataItem}: ${er.cause}\n`);
    });

    return message;
}

async function fetchResource(url, secret, optionalLog = null){

    if(optionalLog){
        console.log(optionalLog);
    }

    console.log(`Sending GET request to --> ${url}`)
    const response = await fetch(url, {headers: {'Authorization': 'Bearer '+secret}});
    if(response.status != 200){
        console.log(`Responded with ${response.status} : ${response.statusText}\n`);
        return response;
    }
    console.log(`Responded with ${response.status} : ${response.statusText}`);
    console.log('Request was sent successfully.');
    const data = await response.json()
    return data;
}

async function fetchBlob(url, secret){
    const response = await fetch(url, {headers: {'Authorization': 'Bearer '+secret}});
    const blob = await response.blob()
    return blob;
}

async function getApiData(secret){

	const maps = await fetchResource('https://gotlegends.info/bot/nms-order/maps', secret, '\nFetching maps...');

	const modifiers = await fetchResource('https://gotlegends.info/bot/nms-order/mods', secret, '\nFetching modifiers...');

	const hazards = await fetchResource('https://gotlegends.info/bot/nms-order/hazards', secret, '\nFetching hazards...');

	return {maps, modifiers, hazards};
}

async function getApiMaps(secret){
	const maps = await fetchResource('https://gotlegends.info/bot/nms-order/maps', secret);
	return maps;
}

async function getApiModifiers(secret){
	const modifiers = await fetchResource('https://gotlegends.info/bot/nms-order/mods', secret);
	return modifiers;
}

async function getApiHazards(secret){
	const hazards = await fetchResource('https://gotlegends.info/bot/nms-order/hazards', secret);
	return hazards;
}

async function downloadImages(urls, secret){
    const images = [];

    urls.forEach(async (url) => {
       try{
            const imageBlob = await fetchBlob(url, secret);
            const imageAttachment = {attachment: imageBlob, name: extractNameFromURL(url)};
            images.push(imageAttachment);
       }catch(error){
            console.log(`Failed to download image from ${url}`);
       }
    })

    return images;
}

function countdown(message, time) {
    let countdownTimer = setInterval(function() {
      process.stdout.write(`\r${message}: ` + (time / 1000) + 's   ');
      time = time - 1000;
  
      if (time < 0) {
        clearInterval(countdownTimer);
        console.log("");
      }
    }, 1000);
  }

async function generateByRawMessage(waves, api_secret, channel){
    const delay = 60000;
    const DEFAULT_COMPLETION_MESSAGE = 'NMS Waves Screenshots:';
    let message = waves;
    console.log("Preparing data to be sent...");

    const apiData = await getApiData(api_secret);
    let data = prepareData(message, apiData);

    if(data.errors){
        const errorMessage = "Some data are invalid:\n"+constructErrorMessage(data.errors);
        console.log(errorMessage);
    } else {
        let response = await postData(data, api_secret, "\nSending POST request to submit the new updates and generating the screenshots......");

        if(!response.ok){
            console.log(`Request failed. Server response: ${response.status} | ${response.statusText} , something went wrong somewhere try again after 120s.`)
        }else{
            countdown('Time Remaining before sending screenshots', delay-3000);

            setTimeout( async () => {

                try {
                    const generatedLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', api_secret, '\nFetching generated screenshots...');

                    let linksMessage = "";
                    let imageAttachments = [];
                    if(generatedLinks){
                        const exclusions = [];
                        Object.values(generatedLinks).filter(screenshot => !screenshot.includes(exclusions[0]) && !screenshot.includes(exclusions[1]) && !screenshot.includes(exclusions[2])).forEach( async (link,index) => {
                            let fullURL = 'https://gotlegends.info'+link;
                            linksMessage = linksMessage.concat(fullURL+"\n");
                            imageAttachments.push({attachment: fullURL, name: extractNameFromURL(fullURL)});
                        })
                        channel.send({content: DEFAULT_COMPLETION_MESSAGE, files: imageAttachments});
                        console.log('\n----------------Screenshots sent.')
                    }
                } catch (error) {
                    console.error(`Failed to send images to ${channel.id}: ${error}`);
                }
            },
            delay
            )
        }
    }
}


module.exports = {
    fetchResource, 
    prepareData, 
    prepDataFromRawText,
    formatRawZones,
    validateData, 
    postData,
    extractNameFromURL, 
    getMapId, 
    getWeek, 
    getModifier, 
    getHazard, 
    getZones, 
    getCredits,
    getGameVersion,
    fetchBlob, 
    getApiData,
    getApiMaps,
    getApiModifiers,
    getApiHazards,
    downloadImages,
    countdown, 
    constructErrorMessage, 
    generateByRawMessage,

}