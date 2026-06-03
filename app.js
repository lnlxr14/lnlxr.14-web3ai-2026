document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const vocalRangeSlider = document.getElementById('vocal-range');
  const vocalRangeVal = document.getElementById('vocal-range-val');
  const artistChips = document.querySelectorAll('.chip');
  const memberSelectors = document.querySelectorAll('#member-selector .selector-btn');
  const generationSelectors = document.querySelectorAll('#generation-selector .selector-btn');
  const moodSelectors = document.querySelectorAll('#mood-selector .selector-btn');
  const originalKeyCheckbox = document.getElementById('original-key-only');
  const btnSubmit = document.getElementById('btn-submit');
  const btnRetry = document.getElementById('btn-retry');
  
  const configSection = document.querySelector('.config-section');
  const loadingArea = document.getElementById('loading-area');
  const resultsArea = document.getElementById('results-area');
  const recommendationsContainer = document.getElementById('recommendations-container');
  const loadingTip = document.getElementById('loading-tip');

  // State
  const state = {
    vocalLevel: 2, // 1: 低音, 2: 中音, 3: 高音
    selectedArtists: [],
    member: 'boss',
    generation: '40s50s',
    mood: 'hype',
    originalKeyOnly: false
  };

  // --- Event Listeners ---

  // 音域スライダー（100段階のスムーズなドラッグに対応）
  vocalRangeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    let level;
    let labelHTML;
    
    if (val < 35) {
      level = 1;
      labelHTML = '<span class="badge" style="background:rgba(157,0,255,0.2);color:#bd00ff;border:1px solid #bd00ff">低音域 (ロー)</span>';
    } else if (val > 65) {
      level = 3;
      labelHTML = '<span class="badge" style="background:rgba(255,0,122,0.2);color:#ff007a;border:1px solid #ff007a">高音域 (ハイ)</span>';
    } else {
      level = 2;
      labelHTML = '<span class="badge bg-cyan">中音域 (標準)</span>';
    }
    
    state.vocalLevel = level;
    vocalRangeVal.innerHTML = labelHTML;
  });

  // アーティストチップ（複数選択トグル）
  artistChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const artistId = chip.dataset.artist;
      if (chip.classList.contains('selected')) {
        state.selectedArtists.push(artistId);
      } else {
        state.selectedArtists = state.selectedArtists.filter(id => id !== artistId);
      }
    });
  });

  // セレクター（単一選択）
  function setupSelector(selectors, stateKey) {
    selectors.forEach(btn => {
      btn.addEventListener('click', () => {
        selectors.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state[stateKey] = btn.dataset.value;
      });
    });
  }
  setupSelector(memberSelectors, 'member');
  setupSelector(generationSelectors, 'generation');
  setupSelector(moodSelectors, 'mood');

  // 原曲キー縛り
  originalKeyCheckbox.addEventListener('change', (e) => {
    state.originalKeyOnly = e.target.checked;
  });

  // 実行ボタン
  btnSubmit.addEventListener('click', () => {
    startMatching();
  });

  // リトライボタン
  btnRetry.addEventListener('click', () => {
    resultsArea.classList.add('hidden');
    configSection.classList.remove('hidden');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Logic ---

  function startMatching() {
    // UI切り替え
    configSection.classList.add('hidden');
    loadingArea.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ローディング中のテキスト切り替えアニメーション
    const tips = [
      "シチュエーションに応じた盛り上がり度をシミュレートしています...",
      "あなたの音域と楽曲のキーをマッチング中...",
      "同席メンバーの世代データから最適解を抽出中..."
    ];
    let tipIdx = 0;
    const tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % tips.length;
      loadingTip.textContent = tips[tipIdx];
    }, 800);

    // モックの遅延 (2.5秒)
    setTimeout(() => {
      clearInterval(tipInterval);
      loadingArea.classList.add('hidden');
      generateAndShowResults();
    }, 2500);
  }

  function generateAndShowResults() {
    // 状態に基づいてモックデータを生成
    const recommendations = getMockRecommendations(state);
    
    // HTML生成
    recommendationsContainer.innerHTML = '';
    
    recommendations.forEach((rec, index) => {
      const isTopPick = index === 0;
      
      const card = document.createElement('div');
      card.className = `result-card ${isTopPick ? 'top-pick' : ''}`;
      
      card.innerHTML = `
        <div class="song-info">
          <h3>${rec.title}</h3>
          <div class="song-artist">アーティスト: ${rec.artist}</div>
        </div>
        
        <div class="metrics">
          <div class="metric-row">
            <span class="metric-label">🎤 音域マッチ</span>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill vocal" style="width: ${rec.vocalMatch}%"></div>
            </div>
            <span class="metric-value">${rec.vocalMatch}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">🔥 盛り上がり</span>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill hype" style="width: ${rec.hypeMatch}%"></div>
            </div>
            <span class="metric-value">${rec.hypeMatch}%</span>
          </div>
        </div>

        <div class="ai-comment">
          <span class="ai-icon">💡</span>
          <p>${rec.comment}</p>
        </div>
      `;
      
      recommendationsContainer.appendChild(card);
    });

    resultsArea.classList.remove('hidden');
  }

  // --- Matching Engine ---
  function getMockRecommendations(currentState) {
    const songDatabase = window.songDatabase || [];
    
    // 各曲の適合スコアを算出
    const scoredSongs = songDatabase.map(song => {
      let score = 50; // 基本スコア
      
      // 1. 音域 (vocalLevel) マッチ度
      let vocalScore = 0;
      let vocalDiff = Math.abs(song.vocalLevel - currentState.vocalLevel);
      
      if (currentState.originalKeyOnly) {
        // 原曲キー縛りの場合
        if (vocalDiff === 0) {
          vocalScore = 100;
          score += 45; // 音域が完全に一致するなら大幅加点
        } else {
          vocalScore = 0;
          score = -9999; // 一致しない場合は完全に除外
        }
      } else {
        // 通常（キー変更可）の場合
        if (vocalDiff === 0) {
          vocalScore = 95 + Math.floor(Math.random() * 5); // 95-99%
          score += 30;
        } else if (vocalDiff === 1) {
          vocalScore = 80 + Math.floor(Math.random() * 10); // 80-89%
          score += 15;
        } else {
          vocalScore = 60 + Math.floor(Math.random() * 10); // 60-69%
          score -= 10;
        }
      }
      
      // 2. 得意アーティストマッチ度
      let isFavArtist = currentState.selectedArtists.includes(song.artistKey);
      if (isFavArtist) {
        score += 60; // 得意アーティストなら非常に高い加点
      }
      
      // 3. ムード（雰囲気）マッチ度
      let isMoodMatch = song.moods.includes(currentState.mood);
      if (isMoodMatch) {
        score += 40; // ムードが一致すれば加点
      } else {
        score -= 20; // ミスマッチなら減点
      }
      
      // 盛り上がり度の算出 (表示用のビジュアル値)
      let hypeBase = 50;
      if (currentState.mood === 'hype') {
        hypeBase = isMoodMatch ? (93 + Math.floor(Math.random() * 6)) : (70 + Math.floor(Math.random() * 10));
      } else if (currentState.mood === 'singalong') {
        hypeBase = isMoodMatch ? (90 + Math.floor(Math.random() * 9)) : (65 + Math.floor(Math.random() * 15));
      } else if (currentState.mood === 'emotional') {
        // エモい時の盛り上がり度は「しっとりした盛り上がり」としてやや低めに表現
        hypeBase = isMoodMatch ? (55 + Math.floor(Math.random() * 15)) : (40 + Math.floor(Math.random() * 15));
      } else {
        // safe (無難)
        hypeBase = isMoodMatch ? (75 + Math.floor(Math.random() * 10)) : (50 + Math.floor(Math.random() * 15));
      }
      
      // 4. 同伴メンバーの年代 (era) マッチ度
      if (currentState.member === 'boss') {
        // 上司: 昭和 > 平成 > 令和
        if (song.era === 'showa') {
          score += 35;
        } else if (song.era === 'heisei') {
          score += 20;
        } else if (song.era === 'reiwa') {
          score -= 15;
        }
        if (song.members.includes('boss')) score += 15;
      } else if (currentState.member === 'friends') {
        // 友達: 令和 > 平成 > 昭和
        if (song.era === 'reiwa') {
          score += 35;
        } else if (song.era === 'heisei') {
          score += 15;
        } else if (song.era === 'showa') {
          score -= 20;
        }
        if (song.members.includes('friends')) score += 15;
      } else if (currentState.member === 'date') {
        // デート: 令和 = 平成 > 昭和
        if (song.era === 'reiwa') {
          score += 25;
        } else if (song.era === 'heisei') {
          score += 25;
        } else if (song.era === 'showa') {
          score -= 15;
        }
        if (song.members.includes('date')) score += 15;
      } else if (currentState.member === 'family') {
        // 家族: 昭和 = 平成 > 令和
        if (song.era === 'showa') {
          score += 20;
        } else if (song.era === 'heisei') {
          score += 20;
        } else if (song.era === 'reiwa') {
          score += 5;
        }
        if (song.members.includes('family')) score += 15;
      }
      
      // 5. 相手の年代層による era マッチ
      if (currentState.generation === '20s') {
        if (song.era === 'reiwa')  score += 30;
        else if (song.era === 'heisei') score += 5;
        else if (song.era === 'showa')  score -= 20;
      } else if (currentState.generation === '30s') {
        if (song.era === 'reiwa')  score += 15;
        else if (song.era === 'heisei') score += 20;
        else if (song.era === 'showa')  score -= 10;
      } else if (currentState.generation === '40s50s') {
        if (song.era === 'reiwa')  score -= 10;
        else if (song.era === 'heisei') score += 25;
        else if (song.era === 'showa')  score += 20;
      } else if (currentState.generation === '60s') {
        if (song.era === 'reiwa')  score -= 25;
        else if (song.era === 'heisei') score += 10;
        else if (song.era === 'showa')  score += 35;
      }

      // コメントの選択
      let comment = "";
      if (currentState.originalKeyOnly) {
        comment = song.commentOriginalKey[currentState.vocalLevel] || song.commentOriginalKey[2];
      } else {
        comment = song.commentTemplates[currentState.vocalLevel] || song.commentTemplates[2];
      }
      
      return {
        title: song.title,
        artist: song.artist,
        vocalMatch: vocalScore,
        hypeMatch: hypeBase,
        comment: comment,
        score: score
      };
    });
    
    // スコアの高い順にソート
    const sortedSongs = scoredSongs.sort((a, b) => b.score - a.score);
    
    // 原曲キー縛りで除外された曲（score === -9999）以外の有効な曲を抽出
    const validSongs = sortedSongs.filter(song => song.score > -1000);
    
    // 結果の決定 (3曲)
    let results = [];
    if (validSongs.length >= 3) {
      results = validSongs.slice(0, 3);
    } else {
      results = [...validSongs];
      // 不足している場合は、原曲キー縛りを無視した中から近い音域の曲をフォールバックとして追加
      const fallbackList = sortedSongs.filter(song => song.score <= -1000);
      for (let i = 0; i < 3 - validSongs.length; i++) {
        if (fallbackList[i]) {
          const songItem = { ...fallbackList[i] };
          songItem.vocalMatch = 40;
          songItem.comment = `【※音域注意】原曲キー縛りで適合する曲が不足したため、近い音域から特別選出しています。原曲キーですが、少し音域が合わない可能性があります。`;
          results.push(songItem);
        }
      }
    }
    
    return results;
  }
});
