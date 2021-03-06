var mineflayer = require('mineflayer')
const config = require('./config.json')
var tpsPlugin = require('mineflayer-tps')(mineflayer)
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalFollow } = require('mineflayer-pathfinder').goals
const bible = require('./data/bible')
const commands = require('./data/commands')
const secrets = require('./secrets.json')
const modules = require('./modules.json')
const spam = require('./data/spam')
const inventoryViewer = require('mineflayer-web-inventory')
var isEating = false
const weapons = [276, 283, 267, 272, 268]
var fs = require('fs')
var end
var isWriting
const express = require('express')
const app = express()
var playerjoin
const ud = require('urban-dictionary')
const armorManager = require('mineflayer-armor-manager')
const viewer = require('prismarine-viewer').mineflayer
const Discord = require('discord.js')
const client = new Discord.Client()

var bot = mineflayer.createBot({
  host: config.host,
  username: secrets.username,
  port: config.port,
  version: config.MCversion,
  hideErrors: true,
  checkTimeoutInterval: 300 * 1000
})

const mcData = require('minecraft-data')(bot.version)
const foodType = [
  mcData.itemsByName.apple.id,
  mcData.itemsByName.mushroom_stew.id,
  mcData.itemsByName.bread.id,
  mcData.itemsByName.cooked_porkchop.id,
  mcData.itemsByName.golden_apple.id,
  mcData.itemsByName.cookie.id,
  mcData.itemsByName.melon.id,
  mcData.itemsByName.cooked_beef.id,
  mcData.itemsByName.cooked_chicken.id,
  mcData.itemsByName.carrot.id,
  mcData.itemsByName.potato.id,
  mcData.itemsByName.baked_potato.id,
  mcData.itemsByName.golden_carrot.id,
  mcData.itemsByName.cooked_rabbit.id,
  mcData.itemsByName.rabbit_stew.id,
  mcData.itemsByName.cooked_mutton.id
]

bot.loadPlugin(pathfinder)
bot.loadPlugin(tpsPlugin)
bot.loadPlugin(armorManager)

bot.once('spawn', () => {
  viewer(bot, { port: 3001 })
  inventoryViewer(bot, { port: 3002 })

  // Draw the path followed by the bot
  const path = [bot.entity.position.clone()]
  bot.on('move', () => {
    if (path[path.length - 1].distanceTo(bot.entity.position) > 1) {
      path.push(bot.entity.position.clone())
      bot.viewer.drawLine('path', path)
    }
  })
})

function text (username, message, whisper) {
  var executed = false
  var prefix
  var messagesplit = message.split(' ')

  const defaultMove = new Movements(bot, mcData)

  console.log(username + ' ' + message + ' (' + whisper + ')')

  if (message.includes('/login')) {
    bot.chat('/login ' + secrets.ingamepassword)
  }

  if (username === undefined) return

  if (username === 'whispers') return

  if (username === 'you') return

  if (username === 'queue') return

  if (username === bot.username) return

  client.channels.cache.get(config.bridge).send(username + ': ' + message)

  if (whisper) {
    prefix = '/tell ' + username + ' '
  } else {
    prefix = ''
  }

  if (message.startsWith('_coords') && modules.coords) {
    bot.chat(prefix + 'My coords are: ' + Number.parseInt(bot.entity.position.x) + ' ' + Number.parseInt(bot.entity.position.y) + ' ' + Number.parseInt(bot.entity.position.z))
    executed = true
  }

  if (message.startsWith('_tps') && modules.tps) {
    bot.chat(prefix + 'Current tps: ' + bot.getTps())
    executed = true
  }

  if (modules.navigation && (!whisper)) {
    if (message.startsWith('_come')) {
      if (bot.players[username] === undefined || bot.players[username].entity == null) {
        bot.chat(username + ' it seems like your out of range.')
      } else {
        const target = bot.players[username].entity
        bot.chat('Going to ' + username + '.')

        const p = target.position

        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1))
      }
      executed = true
    }

    if (message.startsWith('_stop')) {
      if (bot.players[username] === undefined || bot.players[username].entity == null) {
        bot.chat('Sorry only player which i see are allowed to use this command.')
      } else {
        bot.chat('Stopping...')
        bot.pathfinder.setMovements(null)
        bot.pathfinder.setGoal(null)
        bot.clearControlStates()
      }
      executed = true
    }

    if (message.startsWith('_follow')) {
      if (bot.players[username] === undefined || bot.players[username].entity == null) {
        bot.chat(username + ' it seems like your out of range.')
      } else {
        const target = bot.players[username].entity
        bot.chat('Starting folowing ' + username + '.')
        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalFollow(target, 3), true)
      }
      executed = true
    }

    if (message.startsWith('_goto')) {
      const cmd = message.split(' ')

      if (cmd.length === 4) { // goto x y z
        const x = parseInt(cmd[1], 10)
        const y = parseInt(cmd[2], 10)
        const z = parseInt(cmd[3], 10)

        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalBlock(x, y, z))
        bot.chat('Going to: x' + x + ' y' + y + ' z' + z)
      } else if (cmd.length === 3) { // goto x z
        const x = parseInt(cmd[1], 10)
        const z = parseInt(cmd[2], 10)

        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalXZ(x, z))
        bot.chat('Going to: x' + x + ' z' + z)
      } else if (cmd.length === 2) { // goto y
        const y = parseInt(cmd[1], 10)

        bot.pathfinder.setMovements(defaultMove)
        bot.pathfinder.setGoal(new GoalY(y))
        bot.chat('Going to: y' + y)
      }
      executed = true
    }
  }

  if (message.startsWith('_ping') && modules.ping) {
    if (message === '_ping') {
      if (bot.players[username]) {
        bot.chat(prefix + username + ' your ping is: ' + bot.players[username].ping)
      } else {
        bot.chat(prefix + 'Sorry i can only ping players.')
      }
    } else {
      if (messagesplit.length === 2) {
        if (bot.players[messagesplit[1]]) {
          if (messagesplit[1] === username) {
            if (bot.players[username]) {
              bot.chat(prefix + username + ' your ping is: ' + bot.players[username].ping)
            } else {
              bot.chat(prefix + 'Sorry i can only ping players.')
            }
          } else {
            bot.chat(prefix + 'The ping of ' + bot.players[messagesplit[1]].username + ' is: ' + bot.players[messagesplit[1]].ping)
          }
        } else {
          bot.chat(prefix + "Sorry i can't find that player.")
        }
      } else {
        bot.chat(prefix + 'Sorry you didnt use: _ping username')
      }
    }
    executed = true
  }

  if (message.startsWith('_gamemode') && modules.gamemode) {
    if (message === '_gamemode') {
      if (bot.players[username] && bot.players[username].gamemode) {
        bot.chat(prefix + username + ' your ping is: ' + bot.players[username].gamemode)
      } else {
        bot.chat(prefix + 'Sorry i cann\'t find you.')
      }
    } else {
      if (messagesplit.length === 2) {
        if (bot.players[messagesplit[1]] && bot.players[messagesplit[1]].gamemode) {
          if (messagesplit[1] === username) {
            if (bot.players[username]) {
              bot.chat(prefix + username + ' your ping is: ' + bot.players[username].gamemode)
            } else {
              bot.chat(prefix + 'Sorry i cann\'t find you.')
            }
          } else {
            bot.chat(prefix + 'The _gamemode of ' + bot.players[messagesplit[1]].username + ' is: ' + bot.players[messagesplit[1]].gamemode)
          }
        } else {
          bot.chat(prefix + "Sorry i can't find that player.")
        }
      } else {
        bot.chat(prefix + 'Sorry you didnt use: _gamemode username')
      }
    }
    executed = true
  }

  if (message.startsWith('_help') && modules.help) {
    bot.chat(prefix + 'PistonBot help: _tps, _ping, _coords, _tpa, _tpy, _rules, _report, _bible, _about, _goto, _come, _stop, _rm, _lm, _fm, _wm, _urban, _discord')
    executed = true
  }

  if (message.startsWith('_discord')) {
    bot.chat(prefix + 'https://discord.gg/zBPKyC5')
  }

  if (modules.tp) {
    if (message.startsWith('_tpa')) {
      if (messagesplit.length === 2) {
        if (Number.parseInt(bot.entity.position.x) >= 1000 || Number.parseInt(bot.entity.position.z) >= 1000) {
          bot.chat('/tpa ' + messagesplit[1])
        } else {
          bot.chat(prefix + 'Sorry i am not 1000 blocks away from spawn. :(')
        }
      } else {
        bot.chat(prefix + 'Sorry you should use: _tpa username')
      }
      executed = true
    }

    if (message.startsWith('_tpy')) {
      if (messagesplit.length === 2) {
        bot.chat('/tpy ' + messagesplit[1])
      } else {
        bot.chat(prefix + 'Sorry you should use: _tpy username')
      }
      executed = true
    }
  }

  if (message.startsWith('_rules') && modules.rules) {
    bot.chat(prefix + "No rules, but pls don't spam, hack, dupe, xray, swear or grief.")
    executed = true
  }

  if (modules.ny && (!whisper)) {
    if (message.startsWith('_no')) {
      bot.chat('NO!')
      executed = true
    }

    if (message.startsWith('_yes')) {
      bot.chat('YES!')
      executed = true
    }
  }

  if (message.startsWith('_report') && modules.report) {
    if (messagesplit.length >= 3) {
      bot.chat(prefix + 'Reported ' + messagesplit[1] + ' for ' + message.replace('_report ' + messagesplit[1], ''))
    } else {
      bot.chat(prefix + 'Sorry you should use: _report username reason')
    }
    executed = true
  }

  if (modules.bible) {
    if (message.startsWith('_bible') || message.startsWith('_verse')) {
      bot.chat(prefix + bible.proverbs[Math.round(Math.random() * (bible.proverbs.length - 1))])
      executed = true
    }
  }

  if (message.startsWith('_about') && modules.about) {
    bot.chat(prefix + 'PistonBot coded by Pistonmaster with <3!')
    executed = true
  }

  if (message.startsWith('_say') && username === 'Pistonmaster') {
    var say = message.replace('_say ', '')

    bot.chat(say)
    executed = true
  }

  if (message.startsWith('_killbot') && username === 'Pistonmaster') {
    bot.chat('/kill')
    executed = true
  }

  if (message.startsWith('_wm') && whisper === false) {
    playerjoin = require('./data/playerjoin.json')

    if (Object.keys(playerjoin).includes(username)) {
      console.log('Player is in the database. Reading the state.')
      if (playerjoin[username]) {
        console.log('messagesplit are true. Setting to false.')
        playerjoin[username] = false
        bot.chat(prefix + 'Deactivated welcome messagesplit. You can toggle them with: _wm')
      } else {
        console.log('messagesplit are false. Setting to true.')
        playerjoin[username] = true
        bot.chat(prefix + 'Activated welcome messagesplit. You can toggle them with: _wm')
      }
    } else {
      console.log('Player is not in the database. Adding the player and setting it to true.')
      bot.chat(prefix + 'Activated welcome messagesplit. You can toggle them with: _wm')
      playerjoin[username] = true
    }

    isWriting = true

    fs.writeFile('./data/playerjoin.json', JSON.stringify(playerjoin), function (err) {
      if (err) {
        console.log(err)
      }
      console.log('Saved playerjoin.')
      isWriting = false
    })
  }

  if (message.startsWith('_urban ')) {
    var term = message.slice(7)
    ud.term(term, (error, entries, tags, sounds) => {
      if (error) {
        console.error(error.message)
      } else {
        var urbananswer = entries[0].definition

        urbananswer = urbananswer.replace(/\r?\n|\r/g, '')

        bot.chat('/tell ' + username + ' ' + urbananswer)
      }
    })
  }

  if (whisper === false) {
    var playerdata = require('./data/playerdata.json')
    var split = message.split(' ')

    if (message.startsWith('_fm') || message.startsWith('_firstmessage')) {
      if (split.length === 1) {
        if (Object.keys(playerdata).includes(username) && playerdata[username][0] !== undefined) {
          bot.chat(username + ' your first message which i recorded was: ' + playerdata[username][0])
        } else {
          bot.chat(username + ' sorry i didnt record any messagesplit from you.')
        }
      } else if (split.length === 2) {
        if (Object.keys(playerdata).includes(split[1]) && playerdata[split[1]][0] !== undefined) {
          bot.chat(username + ' here is the first message which i recorded from ' + split[1] + ': ' + playerdata[split[1]][0])
        } else {
          bot.chat(username + ' sorry i didnt record any messagesplit from ' + split[1] + '.')
        }
      } else if (split.length > 2) {
        bot.chat('Please use: _fm username or _fm')
      }
      executed = true
    }

    if (message.startsWith('_lm') || message.startsWith('_lastmessage')) {
      if (split.length === 1) {
        if (Object.keys(playerdata).includes(username) && playerdata[username][0] !== undefined) {
          bot.chat(username + ' your last message which i recorded was: ' + playerdata[username][playerdata[username].length - 1])
        } else {
          bot.chat(username + ' sorry i didnt record any messagesplit from you.')
        }
      } else if (split.length === 2) {
        if (Object.keys(playerdata).includes(split[1]) && playerdata[split[1]][0] !== undefined) {
          bot.chat(username + ' here is the last message which i recorded from ' + split[1] + ': ' + playerdata[split[1]][playerdata[split[1]].length - 1])
        } else {
          bot.chat(username + ' sorry i didnt record any messagesplit from ' + split[1] + '.')
        }
      } else if (split.length > 2) {
        bot.chat('Please use: _lm username or _lm')
      }
      executed = true
    }

    if (message.startsWith('_rm') || message.startsWith('_randommessage')) {
      if (split.length === 1) {
        if (Object.keys(playerdata).includes(username) && playerdata[username][0] !== undefined) {
          bot.chat(username + ' here is a random message which i recorded from you: ' + playerdata[username][Math.round(Math.random() * (playerdata[username].length - 1))])
        } else {
          bot.chat(username + ' sorry i didnt record any messagesplit from you.')
        }
      } else if (split.length === 2) {
        if (Object.keys(playerdata).includes(split[1]) && playerdata[split[1]][0] !== undefined) {
          bot.chat(username + ' here is a random message which i recorded from ' + split[1] + ': ' + playerdata[split[1]][Math.round(Math.random() * (playerdata[split[1]].length - 1))])
        } else {
          bot.chat(username + ' sorry i didnt record any messagesplit from ' + split[1] + '.')
        }
      } else if (split.length > 2) {
        bot.chat('Please use: _rm username or _rm')
      }

      executed = true
    }

    if (message.startsWith('_phrases') && username === 'Pistonmaster') {
      bot.chat('Calculating amount of ALL saved phrases.')

      playerdata = require('./data/playerdata.json')
      var amount1 = 0

      for (var player1 in playerdata) {
        amount1 = amount1 + playerdata[player1].length
      }

      setTimeout(() => bot.chat('Amount of ALL phrases: ' + amount1), 2000)
    }

    if (message.startsWith('_words') && username === 'Pistonmaster') {
      bot.chat('Calculating amount of ALL saved words.')

      playerdata = require('./data/playerdata.json')
      var amount2 = 0

      for (var player2 in playerdata) {
        for (var phraseindex in playerdata[player2]) {
          var phrasetext = playerdata[player2][phraseindex]
          var phrasesplit = phrasetext.split(' ')
          amount2 = amount2 + phrasesplit.length
        }
      }

      setTimeout(() => bot.chat('Amount of ALL words: ' + amount2), 2000)
    }

    if (executed === false) {
      if (Object.keys(playerdata).includes(username)) {
        console.log('Player is in the database. Adding the message.')
        playerdata[username].push(message)
      } else {
        console.log('Player is not in the database. Adding the player and the message to the database.')
        playerdata[username] = [message]
      }

      isWriting = true
      fs.writeFile('./data/playerdata.json', JSON.stringify(playerdata), function (err) {
        if (err) {
          console.log(err)
        }
        console.log('Saved playerdata.')
        isWriting = false
      })
    }
  }
}

bot.on('chat', function (username, message) {
  text(username, message, false)
})

bot.on('whisper', function (username, message, a, jsonMsg) {
  text(username, message, true)
})

if (modules.web) {
  app.use('/', (req, res) => {
    var playerdata = require('./data/playerdata.json')

    res.send(JSON.stringify(playerdata))
  })

  app.listen(3003)
}

bot.on('login', function () {
  bot.chat('/login ' + secrets.ingamepassword)

  console.log('I spawned and set everything up.')
})

bot.once('spawn', function () {
  setInterval(() => {
    if (modules.eat) {
      if (isEating === false && (bot.food !== 20)) {
        var food = checkFood(bot.inventory)

        if (food) {
          bot.equip(food, 'hand', (err) => {
            if (err) {
              console.log(err)
            }
          })
          isEating = true
          bot.consume(function () { isEating = false })
        }
      }
    }

    if (isEating === false && modules.attack) {
      var weapon = checkWeapon(bot.inventory)

      if (weapon) {
        bot.equip(weapon, 'hand', (err) => {
          if (err) {
            console.log(err)
          }
        })
      }
    }

    var entity = nearestEntity()
    if (entity) {
      if (entity.type === 'player') {
        bot.lookAt(entity.position.offset(0, 1, 0))
      } else if (entity.type === 'mob') {
        bot.lookAt(entity.position)
      }

      if (entity.type === 'mob' && entity.kind === 'Hostile mobs' && modules.attack) {
        bot.attack(entity)
      }
    }
  }, 25)

  setInterval(() => {
    if (modules.totem) {
      var totem = bot.inventory.findInventoryItem(mcData.itemsByName.totem_of_undying.id, null)
      var isTotemInOffHand = false

      if (bot.inventory.slots[45] !== null && bot.inventory.slots[45].type === mcData.itemsByName.totem_of_undying.id) {
        isTotemInOffHand = true
      }

      if (totem !== null && totem.slot !== 45 && !isTotemInOffHand) {
        bot.equip(totem, 'off-hand', (err) => {
          if (err) {
            console.log(err)
          }
        })
      }
    }
  }, 300)

  setInterval(() => {
    if (end && !isWriting) {
      process.exit(0)
    }
  }, 100)
})

if (modules.spam) {
  setInterval(() => {
    bot.chat(spam.txt[Math.round(Math.random() * (spam.txt.length - 1))])
  }, 30000)
}

if (modules.bchelp) {
  setInterval(() => {
    bot.chat(commands.bc[Math.round(Math.random() * (commands.bc.length - 1))])
  }, 120000)
}

bot.on('kicked', function (reason) {
  console.log('I got kicked for ' + reason)

  end = true
})

bot.on('end', () => {
  console.log('I end now.')

  end = true
})

bot.on('error', () => {})

bot.on('playerJoined', function (player) {
  playerjoin = require('./data/playerjoin.json')
  if (playerjoin[player.username]) {
    bot.chat('> Welcome ' + player.username + ' to this server!')
  }
})

bot.on('path_update', (results) => {
  console.log('I can get there in ' + results.path.length + ' moves. Computation took ' + results.time.toFixed(2) + ' ms.')
})

function nearestEntity (type) {
  var id, entity, dist
  var best = null
  var bestDistance = null
  for (id in bot.entities) {
    entity = bot.entities[id]
    if (type && entity.type !== type) continue
    if (entity === bot.entity) continue
    dist = bot.entity.position.distanceTo(entity.position)
    if (!best || dist < bestDistance) {
      best = entity
      bestDistance = dist
    }
  }
  return best
}

function checkFood (window) {
  var food = null

  window.items().forEach(Item => {
    if (foodType.includes(Item.type)) {
      food = Item
    }
  })

  return food
}

function checkWeapon (window) {
  var index = weapons.length
  var weapon = null

  window.items().forEach(Item => {
    if (weapons.includes(Item.type)) {
      if (weapons.indexOf(Item.type) < index) {
        index = weapons.indexOf(Item.type)

        weapon = Item
      }
    }
  })

  return weapon
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)

  client.user.setPresence({
    status: 'online',
    activity: {
      type: 'PLAYING',
      url: 'https://6b6t.org',
      name: '6b6t.org | _help',
      application: {
        id: '712245398269329511'
      }
    }
  })
})

client.on('message', msg => {
  var message = ''
  var found = false
  var player
  var messagepart
  var split

  if (msg.content.startsWith('_sendmessage')) {
    split = msg.content.split(' ')

    if (split.length === 1) {
      msg.reply('Usage: _sendmessage player message')
    }

    if (split.length === 2) {
      msg.reply('Please specify a message.')
    }

    if (split.length > 2) {
      for (player in bot.players) {
        if (bot.players[player].username === split[1]) {
          found = true
        }
      }

      if (found) {
        for (messagepart in split) {
          if (messagepart > 1) {
            message = message + split[messagepart] + ' '
          }
        }

        bot.chat('/tell ' + split[1] + ' ' + msg.author.username + '#' + msg.author.discriminator + ' ' + message)
      } else {
        msg.reply("Sorry i can't find that user on the server.")
      }
    }
  } else if (msg.content.startsWith('_broadcast')) {
    split = msg.content.split(' ')

    if (split.length === 1) {
      msg.reply('Please specify a message.')
    }

    if (split.length > 1) {
      for (messagepart in split) {
        if (messagepart > 0) {
          message = message + split[messagepart] + ' '
        }
      }

      bot.chat(msg.author.username + '#' + msg.author.discriminator + ' ' + message)
    }
  } else if (msg.content.startsWith('_help')) {
    msg.reply('PistonBot Discord help: _sendmessage, _help, _discord')
  } else if (msg.channel.id === config.bridge && msg.member.user !== client.user) {
    bot.chat('> [ChatBridge] ' + msg.author.username + ': ' + msg.content)
  } else if (msg.content.startsWith('_discord')) {
    msg.reply('PistonBot Discord: https://discord.gg/zBPKyC5')
  }
})

client.login(secrets.token)
