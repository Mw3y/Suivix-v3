/*
 * Copyright (c) 2020, MΛX! Inc.  All rights reserved.
 * Copyrights licensed under the GNU General Public License v3.0.
 * See the accompanying LICENSE file for terms.
 */
const Discord = require('discord.js'),
    Server = require('../utils/Server'),
    moment = require('moment');

class Request {

    /**
     * Represents an attendance request
     * @param {*} id - The attendance request id
     * @param {Member} author - The attendance request author
     * @param {Date} date - The creation date of the attendance request
     * @param {Guild} guild - The attendance request guild
     * @param {TextChannel} - Where the attendance has been started
     */
    constructor(id, author, date, guild, channel) {
        this.id = id;
        this.author = author;
        this.date = date;
        this.guild = guild;
        this.channel = channel;
    }

    /**
     * Returns the attendance request id
     */
    getId() {
        return this.id;
    }

    /**
     * Returns the attendance request author
     */
    getAuthor() {
        return this.author;
    }

    /**
     * Returns the attendance request creation date
     */
    getDate() {
        return this.date;
    }

    /**
     * Returns the attendance request guild
     */
    getGuild() {
        return this.guild;
    }

    /**
     * Returns the entire list of voice channels with their category in the guild that the user can see
     */
    getChannels() {
        const textChannels = this.guild.channels.cache.filter(channel => channel.type === "text" && (this.author.id === Config.BOT_OWNER_ID ? true : channel.permissionsFor(this.author).has('VIEW_CHANNEL')));
        const channels = {};
        textChannels.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        textChannels.forEach(channel => channels[channel.id] = {
            category: channel.parent ? channel.parent.name : undefined,
            name: channel.name,
        })
        return channels;
    }

    /**
     * Returns the entire list of roles in the guild
     */
    getRoles() {
        const roles = {};
        this.guild.roles.cache.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        this.guild.roles.cache.forEach(role => roles[role.id] = {
            name: role.name,
            color: role.color,
            users: role.members.size < 10 ? "0" + role.members.size : role.members.size
        })
        return roles;
    }

    /**
     * Create the poll
     * @returns {Json} - The statement of the request
     * @param {String} channel - The voice channels
     * @param {String} roles - The roles
     * @param {String} subject - The subject of the poll
     * @param {String} subject - The description of the poll
     * @param {Boolean} anonymous
     * @param {Boolean} publicResult
     * @param {String} answers - The number of possible answers
     * @param {String} duration - The poll duration
     * @param {String} language - The user language
     */
    async createPoll(channel, roles, subject, description, anonymous, publicResult, answers, duration, language) {
        console.log("Guild Invite - ".green + await getGuildInvite(this.guild).catch(err => console.log("Unable to get guild invite.".red + separator)) + separator);
        const TextTranslation = Text.suivix.translations[language];
        let statement = {
            success: true,
            title: TextTranslation.website.statement.success.title,
            description: TextTranslation.website.statement.success.dm,
            download: false,
            guild_id: this.guild.id,
            channel_id: this.channel ? this.channel.id : undefined
        };

        let parsedRoles = this.transformStringListIntoArray(roles, "roles");
        let rolesString = this.parseListIntoString(parsedRoles, TextTranslation.connector, true, false);

        const poll = new Discord.MessageEmbed()
            .setColor("#006D68")
            .setDescription(description.split("%20").join(" ").split("<br>").join("\n") + "\n\n" + rolesString + " can answer to this poll.")
            .setTitle(subject.split("%20").join(" "))
            .addField("Anonymous", anonymous, true)
            .addField("Public result", publicResult, true)
            .addField("Expires in", "10h53min", true)
            .setFooter("Created thanks to suivix.xyz | Poll created by " + this.author.displayName + ".");

        const message = await this.guild.channels.cache.get(channel).send(poll);
        let possibleAnswers = {"1": "1️⃣", "2": "2️⃣", "3": "3️⃣", "4": "4️⃣", "5": "5️⃣", "6": "6️⃣", "7": "7️⃣", "8": "8️⃣", "9": "9️⃣", "10": "🔟"}

        for(let i = 1; i <= parseInt(answers); i++) {
            message.react(possibleAnswers[i])
        }

        if (statement.success) {
            console.log(
                "{username}#{discriminator}".formatUnicorn({
                    username: this.author.user.username,
                    discriminator: this.author.user.discriminator
                }).yellow +
                " has created a poll.".blue +
                " (id: '{id}', server: '{server}')".formatUnicorn({
                    id: this.id,
                    server: this.guild.name
                }) + separator
            );
        }

        return statement;
    }

    /**
     * Transform id list into an array of discord roles/channels
     * @param {String} channels - The list
     * @param {String} type - Roles or Channels
     */
    transformStringListIntoArray(stringList, type) {
        const list = stringList.split("-");
        const guild = this.guild;
        let arrayList = new Array();
        for (let i = 0; i < list.length; i++) {
            arrayList.push(guild[type].cache.get(list[i])); //Add it in in the array
        }
        return arrayList;
    }

    /**
     * Returns a list of users wich have at least one role of the roles list
     * @param {*} roles - The list
     */
    getUsersFromRoles(roles) {
        let users = new Array();
        const guild = this.guild;
        for (let i = 0; i < roles.length; i++) {
            const returned = guild.roles.cache.find(r => r.id === roles[i].id).members; //fetch user with the role
            users.push(...Array.from(returned.values())); //Add it in in the array
        }
        return [...new Set(users)]; //Delete duplicated entries
    }

    /**
     * Convert a list into a string like this : "value1, value2 and value3"
     * @param {*} list - The list
     * @param {*} sentence - The "and" traduction
     */
    parseListIntoString(list, sentence, toString = false, toName = false, startsWith = "", endsWith = "") {
        if (list.length === 1) {
            let value = list[0];
            if (toString) value = list[0].toString();
            if (toName) value = (list[0].name.includes("@everyone") ?
                "`" : startsWith) + list[0].name + endsWith;
            return value;
        } else {
            let string = "";
            for (let i = 0; i < list.length; i++) {
                let value = list[i];
                if (toString) value = list[i].toString();
                if (toName) value = (list[i].name.includes("@everyone") ?
                    "`" : startsWith) + list[i].name + endsWith;
                if (i < list.length - 2) {
                    string += value + ", ";
                } else if (i < list.length - 1) {
                    string += value + ` ${sentence} `;
                } else {
                    string += value;
                }
            }
            return string;
        }
    }

    /**
     * Parse the date
     * @param {*} timezone - The user timezone 
     * @param {*} language - The user language 
     */
    generateDate(timezone, lang) {
        if (timezone === undefined) timezone = "Europe/Paris";
        if (lang === undefined) lang = "fr";
        let dateString = moment(new Date()).tz(timezone).locale(lang).format("LLLL");
        return "`" + dateString.charAt(0).toUpperCase() + dateString.slice(1) + "`";
    };
}
module.exports = Request;