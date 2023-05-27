const { Client } = require('@notionhq/client');
const settings = require('./settings.json');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

const notionPageUpdate = async (data) => {
	try {
		const users = [];
		for (const userId of data.userid) {
			const user = await userQuery(userId);
			if (user) {
				users.push(user);
			}
		}

		// data.imageがundefinedか、空文字の場合は、仮の画像を設定する
		if (!data.image || data.image === "") {
			data.image = "https://pbs.twimg.com/profile_images/1465762338871644162/nYSe4c4G_400x400.jpg";
		}

		const request = {
			database_id: settings.NOTION_CONTRIBUTION_DB_ID,
		}

		const databaseResponse = await notion.databases.retrieve({ database_id: request.database_id })


		const response = await notion.pages.create({
			"parent": {
				"type": "database_id",
				"database_id": databaseResponse.id
			},
			"properties": {
				"title": {
					"title": [
						{
							"text": {
								"content": data.event_name
							}
						}
					]
				},
				"description": {
					"rich_text": [
						{
							"text": {
								"content": data.event_description
							},
						}
					],
				},
				"date": {
					"date": {
						"start": data.event_date
					}
				},
				//usersに追加する
				"users": {
					"relation": users
				},
				"image": {
					"files": [
						{
							"type": "external",
							"name": "image",
							"external": {
								"url": data.image
							}
						}
					]
				},
				"weighting": {
					"select": {
						"id": '4184cdf4-599e-472e-921f-acf2af1ebd9c',
					}
				}
			},
		});
		console.log(response);
	} catch (e) {
		console.error(e);
	}
}
exports.notionPageUpdate = notionPageUpdate;

const userQuery = async (userid) => {
	const userRequest = {
		database_id: settings.NOTION_MEMBER_DB_ID,

		filter: {
			property: "id",
			rich_text: {
				equals: userid,
			},
		}
	}

	const userDBResponse = await notion.databases.query(userRequest);
	if (userDBResponse.results.length > 0) {
		const userDataId = userDBResponse.results[0].id;
		const user = { id: userDataId };
		return user;
	} else {
		console.error(`User ${userid} doesn't exist in the Members DB yet`);
		return null;
	}
}


// test
// const test = async () => {
// 	const data = {
// 		event_name: "これはどうだろう",
// 		event_description: "test",
// 		event_date: "2021-10-01",
// 		userid: ["937906941257199667"],
// 	}
// 	await notionPageUpdate(data);
// }

// test();

