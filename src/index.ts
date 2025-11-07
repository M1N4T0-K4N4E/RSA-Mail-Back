import dotenv from 'dotenv';
import { prepareNotifyMail } from './mailer.js';   // Adjust the import path as necessary
import cron from 'node-cron';  
import express from 'express';
import PocketBase, { RecordModel } from 'pocketbase';

dotenv.config(); // Load environment variables from .env file
    
const app = express(); // Initialize Express application


async function queryPocketBase() {

    console.log('Initializing PocketBase client...');
    let favList: any[] = [];
    console.log('Connecting to PocketBase at ', process.env.PB_URL);
    const pb = new PocketBase(process.env.PB_URL);
    await pb.collection('_superusers').authWithPassword(
      process.env.PB_ADMIN_USER || '', 
      process.env.PB_ADMIN_PASS || ''
    );

    // post list that just verify but not notify yet
    const resultPost = await pb.collection('Posts').getList(1, 50, {
        filter: 'Verify = true && Notify = false',
        expand: 'Type',
        sort: '-created',
    });

    // user favorite group by post event that not notify yet
    // await Promise.all(resultPost.items.map(async (item) => {
    //     favList.push(await pb.collection('Favorites').getFullList(200, {
    //         filter: `PostID = "${item.id}" && Notify = false`, 
    //         expand: 'PostID,UserID',
    //         sort: 'created',
    //     }));
    // }));
    // favList = favList.flat();

    // query all user
    const userList = await pb.collection('users').getFullList(200, {
        sort: 'created',
    });

    console.log('Query successful, found', resultPost.items.length, 'Post records.');
    // console.log('Favorite list to notify:', favList.length);
    console.log('User to notify:', userList.length, ' users.');

    return { PostList: resultPost.items, UserList: userList };
}

async function runScheduledTask() {
  console.log(`\n--- Running scheduled task at ${new Date().toLocaleString()} ---`);
  const { PostList, UserList } = await queryPocketBase();
  await prepareNotifyMail({ PostList, UserList });
  console.log('--- Task finished ---');
}

// 9am and 4pm every day
cron.schedule('0 9,16 * * *', runScheduledTask, {
  timezone: "Asia/Bangkok"
});

console.log('Cron job scheduled to run at 9:00 AM and 4:00 PM every day (+7 timezone).');

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`PocketBase scheduler service is running on port ${PORT}.`);
});

app.get('/', (req, res) => {
    res.send('PocketBase scheduler service is running.');
});

await sleep(10000).then(() => {
    console.log('Initial wait complete, starting first scheduled task...');
    runScheduledTask(); // Run immediately after initial wait
});

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Keep the Node.js process running
process.stdin.resume();