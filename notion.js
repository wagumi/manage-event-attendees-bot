const { Client } = require('@notionhq/client');

require('dotenv').config();

const notion = new Client({ auth: process.env.WAGUMI_TEST_API_TOKEN });

const notionPageUpdate = async (dummyData) => {
	try{
		const users = [];
		for(const userId of dummyData.userid) {
			const user = await userQuery(userId);
			users.push(user);
		}


			const request = {
				 //本番用
				database_id: process.env.WAGUMI_TEST_DB_ID,
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
							"content": dummyData.event_name
						}
					}
					]
				},
				"description": {
					"rich_text": [
						{
							"text": {
								"content": dummyData.event_description
							},
						}
					],
				},
				"date": {
					"date": {
						"start": dummyData.event_date
					}
				},
				 //usersに追加する
				"users": {
					"relation" : users
				}
			}
		},
			
	);
			 console.log(response);
} catch(e) {
		console.error(e);
	}
}
exports.notionPageUpdate = notionPageUpdate;

const userQuery = async (userid) => {
    const userRequest = {
        database_id: process.env.WAGUMI_TEST_USER_ID,

        filter: {
            property: "id",
            rich_text: {
                equals: userid,
            },
        }
    }

    const userDBResponse = await notion.databases.query(userRequest);
    const userDataId = userDBResponse.results[0].id;
    const user = {id : userDataId};
    return user;
}

