const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'your-atlas-connection-uri';
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Error connecting to MongoDB:", err));

const client = mongoose.connection.getClient();
const db = client.db("tournamentDB");
const gamesCollection = db.collection("games");
const playersCollection = db.collection("players");

// Define API routes
app.post('/log-game-result', async (req, res) => {
    console.log('log-game-result');
    const { team1, team2 } = req.body;

    if (!team1 || !team2 || team1.players.length !== 2 || team2.players.length !== 2 || team1.score === undefined || team2.score === undefined) {
        return res.status(400).json({ message: 'Invalid data. Each team must have 2 players and scores for both teams must be provided.' });
    }

    const gameQuery = {
        $or: [
            { 'team1.players': team1.players, 'team2.players': team2.players },
            { 'team1.players': team2.players, 'team2.players': team1.players }
        ]
    };

    try {
        const existingGame = await gamesCollection.findOne(gameQuery);
        const newGame = {
            team1: team1,
            team2: team2,
            timestamp: existingGame ? existingGame.timestamp : new Date()
        };

        if (existingGame) {
            await gamesCollection.updateOne(gameQuery, { $set: newGame });
        } else {
            await gamesCollection.insertOne(newGame);
        }

        await Promise.all([...team1.players, ...team2.players].map(async (player) => {
            const existingPlayer = await playersCollection.findOne({ name: player });
            if (!existingPlayer) {
                await playersCollection.insertOne({ name: player, wins: 0, losses: 0, pointDifferential: 0 });
            }
        }));

        await updatePlayerStandings(team1, team1.score, team2.score);
        await updatePlayerStandings(team2, team2.score, team1.score);

        res.status(200).json({ message: 'Game result logged successfully!', gameResult: newGame });
    } catch (error) {
        console.error('Error saving game result:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

async function updatePlayerStandings(team, teamScore, opponentScore) {
    const isWinner = teamScore > opponentScore;
    const pointDiff = teamScore - opponentScore;
    if (teamScore === -1 && opponentScore === -1) {
        return;
    }
    for (const player of team.players) {
        const playerRecord = await playersCollection.findOne({ name: player });
        if (playerRecord) {
            const updateFields = {
                $inc: {
                    wins: isWinner ? 1 : 0,
                    losses: isWinner ? 0 : 1,
                    pointDifferential: pointDiff
                }
            };
            await playersCollection.updateOne({ name: player }, updateFields);
        }
    }
}

app.get('/game-results', async (req, res) => {
    try {
        const results = await gamesCollection.find().toArray();
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching game results:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/standings', async (req, res) => {
    console.log('standings');
    try {
        const players = await playersCollection.aggregate([
            {
                $addFields: {
                    winLossRatio: { $cond: { if: { $eq: ["$losses", 0] }, then: "$wins", else: { $divide: ["$wins", "$losses"] } } }
                }
            },
            { $sort: { winLossRatio: -1, pointDifferential: -1 } }
        ]).toArray();
        res.status(200).json(players);
    } catch (error) {
        console.error('Error fetching standings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/games-with-missing-scores', async (req, res) => {
    console.log('games with missing scores');
    try {
        const games = await gamesCollection.find({ "team1.score": -1, "team2.score": -1 }).toArray();
        res.status(200).json(games);
    } catch (error) {
        console.error('Error fetching games with missing scores:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Serve static files from the React app in production mode
if (process.env.NODE_ENV === 'production') {
    console.log('-------------------------here-------------------------');
    app.use(express.static(path.join(__dirname, '../frondend/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frondend/build', 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
