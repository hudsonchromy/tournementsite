import React, { useState, useEffect } from 'react';
import axios from 'axios';
import bgImage from './logo-small.png';
import './App.css';


function App() {
  const [standings, setStandings] = useState([]);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const [currentGames, setCurrentGames] = useState([]);
  const [showAddGameScreen, setShowAddGameScreen] = useState(false);
  const [newGamePlayers, setNewGamePlayers] = useState(['', '', '', '']);
  const [newGameText, setNewGameText] = useState('');
  const [oneGameMode, setOneGameMode] = useState(true);
  const [team1Scores, setTeam1Scores] = useState([0,0,0]);
  const [team2Scores, setTeam2Scores] = useState([0,0,0]);

  useEffect(() => {
    fetchStandings();
    fetchRecommendedGames();
  }, []);

  const fetchStandings = async () => {
    try {
      const response = await axios.get('/standings');
      console.log(response);
      setStandings(response.data);
    } catch (error) {
      console.error('Error fetching standings:', error);
    }
  };

  const fetchRecommendedGames = async () => {
    try {
      const response = await axios.get('/games-with-missing-scores');
      setRecommendedGames(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching recommended games:', error);
    }
  };

  const moveToCurrentGames = (game) => {
    console.log(game);
    console.log(currentGames);
    if (currentGames.length < 3) {
      setCurrentGames([...currentGames, game]);
      console.log(recommendedGames.filter((g) => g._id !== game._id));
      console.log(recommendedGames);
      setRecommendedGames(recommendedGames.filter((g) => {console.log(g._id, game._id, g._id !== game._id); return g._id !== game._id}));
    } else {
      alert('Only 3 games can be active at a time.');
    }
  };

  const handleGameSubmit = async (index) => {
    const game = currentGames[index];
    try {
      await axios.post('/log-game-result', game);
      alert('Game result logged successfully!');
      const updatedGames = [...currentGames];
      updatedGames.splice(index, 1);
      setCurrentGames(updatedGames);
      fetchStandings();
    } catch (error) {
      console.error('Error logging game result:', error);
      alert('Error logging game result.');
    }
  };

  const handleAddGame = async () => {
    const lines = newGameText.split('\n').map(line => line.trim()).filter(line => line);
    const newGames = lines.map(line => {
      const players = line.split(' ');
      if (players.length !== 4) {
        alert('Each line must contain exactly 4 players.');
        return null;
      }
      return {
        team1: { players: [players[0], players[1]], score: -1 },
        team2: { players: [players[2], players[3]], score: -1 }
      };
    }).filter(game => game !== null);

    try {
      for (const game of newGames) {
        await axios.post('/log-game-result', game);
      }
      alert('New games added successfully!');
      setShowAddGameScreen(false);
      setNewGameText('');
      fetchRecommendedGames();
    } catch (error) {
      console.error('Error adding new games:', error);
      alert('Error adding new games.');
    }
  };

  const removeFromCurrentGames = (index) => {
    const game = currentGames[index];
    setCurrentGames(currentGames.filter((_, i) => i !== index));
    setRecommendedGames([...recommendedGames, game]);
  };

  // Styles
  const primaryColor = '#082F14';
  const backgroundColor = '#f1f4f1'; // light background to contrast with dark primary color
  const backgroundImageUrl = 'logo.png'; // Replace with your actual image URL

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: backgroundColor,
    backgroundImage: `url(${bgImage})`,
    backgroundRepeat: 'repeat',
    height: '100vh',
    overflow: 'hidden'
  };

  const columnStyle = {
    width: '30%',
    border: `1px solid ${primaryColor}`,
    borderRadius: '8px',
    boxShadow: '2px 2px 12px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: 5,
    backgroundColor: '#fff',
    height: '100%',
    overflow: 'auto',
    maxHeight: '87vh',
    alignItems: 'center', // Centers all content horizontally
    textAlign: 'center', // Ensures text is centered
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    borderBottom: `2px solid ${primaryColor}`,
    padding: '10px',
    textAlign: 'left',
    color: primaryColor,
  };

  const tdStyle = {
    borderBottom: '1px solid #ddd',
    padding: '10px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: primaryColor,
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '5px 0',
    transition: '0.3s',
  };

  const buttonDeleteStyle = {
    ...buttonStyle,
    backgroundColor: '#d9534f',
  };

  const inputStyle = {
    padding: '10px',
    width: 'calc(50% - 20px)',
    margin: '10px 0',
    border: `1px solid ${primaryColor}`,
    borderRadius: '4px',
  };

  const h2Style = {
    color: primaryColor,
    textAlign: 'center',
    backgroundColor: `${primaryColor}20`, // Adds a faint version of primary color (20% opacity)
    padding: '10px',
    borderRadius: '5px',
    marginTop: 0
  };


  const cardStyle = {
    marginBottom: 10,
    padding: 10,
    border: '1px solid var(--primary-color)',
    borderRadius: 8,
    boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)',
    backgroundColor: 'var(--card-background)',
    textAlign: 'center', // Centers text inside the card
  };

  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px',
    border: `1px solid ${primaryColor}`,
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '2px 2px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'center', // Centers buttons horizontally
    marginTop: '10px',
  };

  return (
      <div className="App" style={containerStyle}>
        {/* Leaderboard Column */}
        <div style={columnStyle}>
          <h2 style={h2Style}>Leaderboard</h2>
          <table style={tableStyle}>
            <thead>
            <tr>
              <th style={thStyle}>Player</th>
              <th style={thStyle}>Wins</th>
              <th style={thStyle}>Losses</th>
              <th style={thStyle}>Point Differential</th>
            </tr>
            </thead>
            <tbody>
            {standings.map((player) => (
                <tr key={player._id}>
                  <td style={tdStyle}>{player.name}</td>
                  <td style={tdStyle}>{player.wins}</td>
                  <td style={tdStyle}>{player.losses}</td>
                  <td style={tdStyle}>{player.pointDifferential}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        {/* Recommended Games Column */}
        <div style={columnStyle}>
          <h2 style={h2Style}>Recommended Games</h2>
          <ul>
            {recommendedGames.map((game) => (
                <div key={game.id} style={cardStyle}>
              <span>
               {game.team1.players.join(' & ')} vs {game.team2.players.join(' & ')}
              </span>
                  <div style={buttonContainerStyle}>
                    <button style={buttonStyle} onClick={() => moveToCurrentGames(game)}>
                      Move to Current
                    </button>
                  </div>
                </div>
            ))}
          </ul>
          <button style={buttonStyle} onClick={() => setShowAddGameScreen(true)} hidden={false}>
            Settings
          </button>
        </div>

        {/* Current Games Column */}
        <div style={columnStyle}>
          <h2 style={h2Style}>Current Games</h2>
          {currentGames.map((game, index) => (
              <div key={index} style={cardStyle}>
                <h3>
                  {game.team1.players.join(' & ')} vs {game.team2.players.join(' & ')}
                </h3>


                {oneGameMode ?
                    <>
                  <input
                      style={inputStyle}
                      type="number"
                      placeholder="Team 1 Score"
                      onChange={(e) => (game.team1.score = parseInt(e.target.value))}
                  />
                  <input
                      style={inputStyle}
                      type="number"
                      placeholder="Team 2 Score"
                      onChange={(e) => (game.team2.score = parseInt(e.target.value))}
                  />
                  </>
                    :
                    <>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <input
                            style={inputStyle}
                            type="number"
                            placeholder="Team 1 Score"
                            onChange={(e) => (team1Scores[0] = parseInt(e.target.value))}
                        />
                        <input
                            style={inputStyle}
                            type="number"
                            placeholder="Team 1 Score"
                            onChange={(e) => (team1Scores[1] = parseInt(e.target.value))}
                        />
                        <input
                            style={inputStyle}
                            type="number"
                            placeholder="Team 1 Score"
                            onChange={(e) => (team1Scores[2] = parseInt(e.target.value))}
                        />
                      </div>

                      <input
                          style={inputStyle}
                          type="number"
                          placeholder="Team 2 Score"
                          onChange={(e) => (team2Scores[0] = parseInt(e.target.value))}
                      />
                      <input
                          style={inputStyle}
                          type="number"
                          placeholder="Team 2 Score"
                          onChange={(e) => (team2Scores[1] = parseInt(e.target.value))}
                      />
                      <input
                          style={inputStyle}
                          type="number"
                          placeholder="Team 2 Score"
                          onChange={(e) => (team2Scores[2] = parseInt(e.target.value))}
                      />
                    </>

                }


                <div style={buttonContainerStyle}>
                  <button style={buttonStyle} onClick={() => handleGameSubmit(index)}>
                    Submit
                  </button>
                  <button style={{margin: 4}} onClick={() => removeFromCurrentGames(index)}>
                    X
                  </button>
                </div>

              </div>
          ))}
        </div>

        {/* Add Recommended Game Screen */}
        {showAddGameScreen && (
            <div className="modal" style={modalStyle}>
              <h2>Add Recommended Games</h2>
              <textarea
                  rows="5"
                  placeholder="Enter games, one per line (e.g., player1 player2 player3 player4)"
                  value={newGameText}
                  onChange={(e) => setNewGameText(e.target.value)}
                  style={{width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${primaryColor}`}}
              />
              <button onClick={handleAddGame}>Add Games</button>
              <button onClick={() => setOneGameMode(prevState => !prevState)}>
                {oneGameMode ? 'Switch to 2/3' : 'Switch to 1'}
              </button>
              <button onClick={() => setShowAddGameScreen(false)}>Cancel</button>
            </div>
        )
        }

      </div>
  )
      ;
}

export default App;
