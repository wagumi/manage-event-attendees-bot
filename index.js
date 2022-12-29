// 各種インポート
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// firestore
const admin = require("firebase-admin");
var serviceAccount = require("./wagumi.json");
// firestoreの初期化および起動
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// discordBotの初期化
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildScheduledEvents] });

client.on('voiceStateUpdate', async(oldState, newState) => {
	//All Date and Time (days,month,year,hours,minutes,seconds)
	var dateJoin = new Date(); 
	var dateUnix = Date.now();
	var datetime = dateJoin.getFullYear() + "/"
	+ (dateJoin.getMonth()+1)  + "/" 
	+ dateJoin.getDate() + " @ "  
	+ dateJoin.getHours() + ":"  
	+ dateJoin.getMinutes() + ":" 
	+ dateJoin.getSeconds();
	console.log(datetime);
	
	// yyyymmddをコレクションIDとし、参加情報(ユーザー情報・入退室時刻)をドキュメントとして保存
	const id = dateJoin.getFullYear().toString() + (dateJoin.getMonth()+1).toString() + dateJoin.getDate().toString()
	const channel = oldState.member.guild.channels.cache.get("945194711973498924");
	const FieldValue = require('firebase-admin').firestore.FieldValue;

	if (oldState.channelId === null && newState.channelId !== null) {
		// ユーザーIDをコレクションIDとし、ユーザー情報をドキュメントとして保存
		const usersRef = db.collection("users").doc(oldState.member.user.id);
		const usersDocSnap = await usersRef.get()
		if (usersDocSnap.exists) {
			console.log("登録済のユーザーです")
		} else {
			console.log("ユーザー情報がないため登録します")
			const user = oldState.member.user
			usersRef.set({
				id:user.id,
				username:user.username,
				discriminator:user.discriminator,
				avatar:user.avatar
			})
		}
		// yyyymmddをコレクションIDとし、参加情報(ユーザー情報・入退室時刻)をドキュメントとして保存
		const userid = oldState.member.user.id
		const username = oldState.member.user.username
		const docRef = db.collection("users").doc(userid).collection("attendances").doc(id);
		const doc = await docRef.get()
		if (doc.exists && doc.data().in!=undefined) {
			console.log("すでに入室記録が存在します。配列に要素を追加します")
			docRef.set({ 
				id:id,
				userid:userid,
				username:username,
				in:FieldValue.arrayUnion(datetime),
				inunix:FieldValue.arrayUnion(dateUnix)
			},{merge: true});
		} else {
			console.log("入室記録が存在しないため、新たに作成します")
			docRef.set({ 
				id:id,
				userid:userid,
				username:username,
				in: [datetime],
				inunix:[dateUnix],
				out:[],
				outunix:[],
			},{merge: true});
		}
		// return channel.send(`**参加** ${oldState.member.user.tag}さんが入室したよ！`);
		return;
	}
	else if (oldState.channelId !== null && newState.channelId === null) {
		// 退室時刻を計算
		var dateJoin = new Date(); 
		var dateUnix = Date.now();
		var datetime = dateJoin.getFullYear() + "/"
		+ (dateJoin.getMonth()+1)  + "/" 
		+ dateJoin.getDate() + " @ "  
		+ dateJoin.getHours() + ":"  
		+ dateJoin.getMinutes() + ":" 
		+ dateJoin.getSeconds();
		console.log(datetime);

		const userid = newState.member.user.id
		const username = oldState.member.user.username
		const docRef = db.collection("users").doc(userid).collection("attendances").doc(id);
		const doc = await docRef.get()
		if (doc.exists) {
			console.log("入室記録が存在しました。退室時刻を記録します")
			docRef.set({ 
				id:id,
				userid:userid,
				username:username,
				out: FieldValue.arrayUnion(datetime),
				outunix:FieldValue.arrayUnion(dateUnix),
			},{merge: true});
		} else {
			console.log("入室記録が存在しませんでした。新たに退室時刻のみ記録します")
			const user = newState.member.user
			docRef.set({ 
				id:id,
				userid:userid,
				username:username,
				out: FieldValue.arrayUnion(datetime),
				outunix:FieldValue.arrayUnion(dateUnix),
			},{merge: true});
		}
		// return channel.send(`**退出** ${newState.member.user.tag}さんが退出したよ！`);
		return;
	}
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; // Botには反応しないようにする
	// if (message.channelId !== "945194711973498923") return; // 指定のチャンネル以外では動作しないようにする

	// メッセージ投稿日時の計算
	var dateJoin = new Date(); 
	var datetime = dateJoin.getFullYear() + "/"
	+ (dateJoin.getMonth()+1)  + "/" 
	+ dateJoin.getDate() + " @ "  
	+ dateJoin.getHours() + ":"  
	+ dateJoin.getMinutes() + ":" 
	+ dateJoin.getSeconds();
	console.log(datetime);
	// yyyymmddをコレクションIDとし、参加情報(ユーザー情報・入退室時刻)をドキュメントとして保存している。参加者であるかの判断のためコレクションIDを取得
	const id = dateJoin.getFullYear().toString() + (dateJoin.getMonth()+1).toString() + dateJoin.getDate().toString()
    console.log("ボイスチャンネルにメッセージが投稿されました")
	const FieldValue = require('firebase-admin').firestore.FieldValue;
	const userid = message.author.id
		const docRef = db.collection("users").doc(userid).collection("attendances").doc(id);
		const doc = await docRef.get()
		if (doc.exists) {
			console.log("ボイスチャンネル参加中のユーザーのため、発言を記録します")
			docRef.set({ 
				comment:FieldValue.arrayUnion(message.content)
			},{merge: true});
		} else {
			console.log("ボイスチャンネル参加中のユーザーではないため記録しません")
		}
	})

client.on('guildScheduledEventUpdate', async(oldState,newState) => {
    console.log(oldState)
	console.log(newState)
	const FieldValue = require('firebase-admin').firestore.FieldValue;
	var startTime = 0; // UNIXtimeでスタートタイムを保持
	var dateUnix = Date.now();
	startTime = dateUnix
	// startTime = newState.scheduledStartTimestamp
	console.log("startTime=>",startTime)
	if (oldState.status === 1 && newState.status === 2) {
		console.log("イベントが開始しました")
		docRef = db.collection("events").doc(newState.id);
		docRef.set({
			id:newState.id,
			guildId:newState.guildId,
			channelId:newState.channelId,
			creatorId:newState.creatorId,
			name:newState.name,
			description:newState.description,
			scheduledStartTimestamp:newState.scheduledStartTimestamp,
			scheduledEndTimestamp:newState.scheduledEndTimestamp,
			privacyLevel:newState.privacyLevel,
			entityType:newState.entityType,
			entityId:newState.entityId,
			userCount:newState.userCount,
		})
		console.log("現時点でのVC滞在者を参加者としてカウントします")
		// メッセージ投稿日時の計算
		var dateUnix = Date.now();
		var dateJoin = new Date();
		var datetime = dateJoin.getFullYear() + "/"
		+ (dateJoin.getMonth()+1)  + "/" 
		+ dateJoin.getDate() + " @ "  
		+ dateJoin.getHours() + ":"  
		+ dateJoin.getMinutes() + ":" 
		+ dateJoin.getSeconds();
		const id = dateJoin.getFullYear().toString() + (dateJoin.getMonth()+1).toString() + dateJoin.getDate().toString()
		const snapshot = await db.collectionGroup("attendances").where("id", "==", id).get()
		var start=0;
		snapshot.forEach(async doc => {
			// 今日VCに入退室した記録があり、かつ入室後まだ退室していない（＝イン時間がアウト時間より新しい）ユーザー
			if (Math.max(...doc.data().inunix)>Math.max(...doc.data().outunix)) {
				console.log("滞在履歴ありのため入室時刻を新たに記録します")
				docRef.set({ 
					in: FieldValue.arrayUnion(datetime),
					inunix:FieldValue.arrayUnion(dateUnix),
				},{merge: true});
			}
		})
	}
	if (oldState.status === 2 && newState.status === 3) {
		console.log("イベントが終了しました。参加情報を取得します")
		// イベント終了日時
		var dateUnix = Date.now();
		// イベント終了日時のunix変換
		var dateJoin = new Date();
		var datetime = dateJoin.getFullYear() + "-"
		+ (dateJoin.getMonth()+1)  + "-" 
		+ dateJoin.getDate() + "T"  
		+ dateJoin.getHours() + ":"  
		+ dateJoin.getMinutes() + ":" 
		+ dateJoin.getSeconds() + "." 
		+ dateJoin % 1000000
		+ "+09:00" ;
		
		const id = dateJoin.getFullYear().toString() + (dateJoin.getMonth()+1).toString() + dateJoin.getDate().toString()
		// テスト
		const snapshot = await db.collectionGroup("attendances").where("id", "==", id).get()
		var start=0;
		// 参加者を格納する配列
		var arr = [];
		snapshot.forEach(doc => {
			console.log(doc.id, '=>', doc.data());
			for(let i = 0; i < doc.data().inunix.length; i++){
				// "c"の要素にあたったら、繰り返し処理を終了し、forブロックを抜ける
				if(Math.abs(startTime-doc.data().inunix[i]) <= 900000){
					start=doc.data().inunix[i]
					break;
				}
			}
			// 参加時間数を計算。ミリ秒のため60000で割る
			// 10分以上参加していれば参加者にカウント
			if (start!=0) {
				const attendTime = ~~((dateUnix-start)/60000)
				console.log(doc.data().username,'さん');
				console.log(attendTime,'分参加');
				console.log(start)
				console.log(dateUnix)
				if (attendTime >= 0) {
					arr.push(doc.data().userid)
				}
			}
		});
		console.log({
					"event_name": newState.name,
					"event_description": newState.description,
					"event_date": datetime,
					"userid": arr
				})
		// https://discord.com/api/oauth2/authorize?client_id=1051171120277102664&permissions=8623492096&scope=bot
	}
});

client.login(process.env.voiceToken).catch(console.error);
