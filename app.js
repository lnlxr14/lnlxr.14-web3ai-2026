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
  const btnShuffle = document.getElementById('btn-shuffle');

  const modeSelectSection = document.getElementById('mode-select-section');
  const btnModeSing = document.getElementById('btn-mode-sing');
  const btnModeLearn = document.getElementById('btn-mode-learn');
  const configSection = document.querySelector('.config-section');
  const loadingArea = document.getElementById('loading-area');
  const resultsArea = document.getElementById('results-area');
  const recommendationsContainer = document.getElementById('recommendations-container');
  const loadingTip = document.getElementById('loading-tip');
  const resultsTitle = document.getElementById('results-title');
  const resultsDesc = document.getElementById('results-desc');

  // ナビタブ関連
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabAI = document.getElementById('tab-ai');
  const tabMySongs = document.getElementById('tab-mysongs');
  const tabSearch = document.getElementById('tab-search');
  const mySongsSection = document.getElementById('my-songs-section');
  const songSearchSection = document.getElementById('song-search-section');
  const songSearchInput = document.getElementById('song-search-input');
  const searchResultsList = document.getElementById('search-results-list');

  // AI関連セクション（タブ切替で使う）
  const aiSections = [modeSelectSection, configSection, loadingArea, resultsArea];

  // 最後に表示していたAIセクションを記憶（タブ復帰時に使う）
  let lastAiSection = modeSelectSection;

  // State
  const state = {
    mode: null, // 'sing' | 'learn'
    vocalLevel: 2, // 1: 低音, 2: 中音, 3: 高音
    selectedArtists: [],
    member: 'boss',
    generation: '40s50s',
    mood: 'hype',
    originalKeyOnly: false
  };

  // --- Tags (localStorage) ---
  function loadTags() {
    try {
      return JSON.parse(localStorage.getItem('karaoke_tags') || '{}');
    } catch(e) {
      return {};
    }
  }

  function saveTag(songTitle, tag) {
    const tags = loadTags();
    if (tag === null) {
      delete tags[songTitle];
    } else {
      tags[songTitle] = tag;
    }
    localStorage.setItem('karaoke_tags', JSON.stringify(tags));
  }

  // --- ナビゲーション ---
  function showTab(tabId) {
    navTabs.forEach(t => t.classList.remove('active'));
    mySongsSection.classList.add('hidden');
    songSearchSection.classList.add('hidden');

    if (tabId === 'ai') {
      tabAI.classList.add('active');
      // 離れる前に表示していたセクションを復元
      aiSections.forEach(s => s.classList.add('hidden'));
      lastAiSection.classList.remove('hidden');
    } else {
      // AIタブを離れる前に現在のセクションを保存
      const visibleSection = aiSections.find(s => !s.classList.contains('hidden'));
      if (visibleSection) lastAiSection = visibleSection;
      aiSections.forEach(s => s.classList.add('hidden'));

      if (tabId === 'mysongs') {
        tabMySongs.classList.add('active');
        renderMySongs();
        mySongsSection.classList.remove('hidden');
      } else if (tabId === 'search') {
        tabSearch.classList.add('active');
        songSearchSection.classList.remove('hidden');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabAI.addEventListener('click', () => showTab('ai'));
  tabMySongs.addEventListener('click', () => showTab('mysongs'));
  tabSearch.addEventListener('click', () => showTab('search'));

  // --- マイソング ---
  function renderMySongs() {
    const tags = loadTags();
    const songDB = window.songDatabase || [];
    const masteredSongs = songDB.filter(s => tags[s.title] === 'mastered');
    const practicingSongs = songDB.filter(s => tags[s.title] === 'practicing');

    const masteredList = document.getElementById('mastered-list');
    const practicingList = document.getElementById('practicing-list');

    function renderList(container, songs, tagType) {
      if (songs.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">${tagType === 'mastered' ? '🎤' : '🎵'}</div>
            <p>${tagType === 'mastered' ? '習得済みの曲はまだありません' : '練習中の曲はまだありません'}</p>
            <p style="font-size:0.85rem;color:var(--text-muted)">AI選曲の結果や「曲を探す」からタグを付けましょう</p>
          </div>`;
        return;
      }
      container.innerHTML = songs.map(song => `
        <div class="my-song-item">
          <div>
            <div class="my-song-title">${song.title}</div>
            <div class="my-song-artist">${song.artist}</div>
          </div>
          <button class="my-song-remove" data-song="${song.title}">✕ 削除</button>
        </div>
      `).join('');
      container.querySelectorAll('.my-song-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          saveTag(btn.dataset.song, null);
          renderMySongs();
        });
      });
    }

    renderList(masteredList, masteredSongs, 'mastered');
    renderList(practicingList, practicingSongs, 'practicing');
  }

  // マイソング内タブ切替
  document.querySelectorAll('.my-songs-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.my-songs-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('mastered-list').classList.toggle('hidden', tab.dataset.tab !== 'mastered');
      document.getElementById('practicing-list').classList.toggle('hidden', tab.dataset.tab !== 'practicing');
    });
  });

  // --- 曲検索 ---
  function renderSearchResults(query) {
    if (!query) {
      searchResultsList.innerHTML = '<p class="search-placeholder">曲名やアーティスト名を入力してください</p>';
      return;
    }
    const songDB = window.songDatabase || [];
    const tags = loadTags();
    const q = query.toLowerCase();
    const results = songDB.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q)
    );
    if (results.length === 0) {
      searchResultsList.innerHTML = '<p class="search-placeholder">曲が見つかりませんでした</p>';
      return;
    }
    searchResultsList.innerHTML = results.map(song => {
      const currentTag = tags[song.title] || null;
      return `
        <div class="search-result-item">
          <div class="search-result-info">
            <div class="search-result-title">${song.title}</div>
            <div class="search-result-artist">${song.artist}</div>
          </div>
          <div class="search-result-tags">
            <button class="tag-btn ${currentTag === 'mastered' ? 'active-mastered' : ''}" data-song="${song.title}" data-tag="mastered">✅ 習得済み</button>
            <button class="tag-btn ${currentTag === 'practicing' ? 'active-practicing' : ''}" data-song="${song.title}" data-tag="practicing">🎵 練習中</button>
          </div>
        </div>
      `;
    }).join('');
    searchResultsList.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentTag = loadTags()[btn.dataset.song];
        saveTag(btn.dataset.song, currentTag === btn.dataset.tag ? null : btn.dataset.tag);
        renderSearchResults(query);
      });
    });
  }

  songSearchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value.trim());
  });

  // --- Mode Selection ---
  const switchModeSing = document.getElementById('switch-mode-sing');
  const switchModeLearn = document.getElementById('switch-mode-learn');

  function updateModeSwitcher(mode) {
    switchModeSing.classList.toggle('active', mode === 'sing');
    switchModeLearn.classList.toggle('active', mode === 'learn');
  }

  function selectMode(mode) {
    state.mode = mode;
    updateModeSwitcher(mode);
    modeSelectSection.classList.add('hidden');
    lastAiSection = configSection;
    configSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  btnModeSing.addEventListener('click', () => selectMode('sing'));
  btnModeLearn.addEventListener('click', () => selectMode('learn'));

  // 設定画面内のモード切替ボタン
  switchModeSing.addEventListener('click', () => {
    state.mode = 'sing';
    updateModeSwitcher('sing');
  });
  switchModeLearn.addEventListener('click', () => {
    state.mode = 'learn';
    updateModeSwitcher('learn');
  });

  // --- Event Listeners ---

  // 音域スライダー
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

  // シャッフルボタン
  btnShuffle.addEventListener('click', () => {
    recommendationsContainer.innerHTML = '';
    generateAndShowResults(true);
  });

  // リトライボタン
  btnRetry.addEventListener('click', () => {
    resultsArea.classList.add('hidden');
    configSection.classList.remove('hidden');
    navTabs.forEach(t => t.classList.remove('active'));
    tabAI.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Logic ---

  function startMatching() {
    configSection.classList.add('hidden');
    loadingArea.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

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

    setTimeout(() => {
      clearInterval(tipInterval);
      loadingArea.classList.add('hidden');
      generateAndShowResults();
    }, 2500);
  }

  function generateAndShowResults(shuffleMode = false) {
    const recommendations = getMockRecommendations(state, shuffleMode);
    const tags = loadTags();
    const isSingMode = state.mode === 'sing';

    // ヘッダー文言をモードに応じて変更
    if (isSingMode) {
      resultsTitle.textContent = '🎤 今日歌える曲はこちら！';
      resultsDesc.textContent = '習得済みの曲・誰でも知ってる曲の中からあなたにぴったりな曲を厳選しました。';
    } else {
      resultsTitle.textContent = '📚 新たに歌える曲候補はこちら！';
      resultsDesc.textContent = 'あなたの音域に合った、練習・挑戦しがいのある曲を提案します。';
    }

    recommendationsContainer.innerHTML = '';

    // 空状態の処理
    if (recommendations.length === 0) {
      recommendationsContainer.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🎵</div>
          <p>条件に合う曲が見つかりませんでした</p>
          <p style="font-size:0.85rem;color:var(--text-muted)">音域設定や原曲キー縛りを変えてみてください</p>
        </div>`;
      resultsArea.classList.remove('hidden');
      return;
    }

    recommendations.forEach((rec, index) => {
      const isTopPick = index === 0;
      const currentTag = tags[rec.title] || null;

      const card = document.createElement('div');
      card.className = `result-card ${isTopPick ? 'top-pick' : ''}`;

      // タグボタンのHTML
      const tagHTML = `
        <div class="tag-btn-group">
          <button class="tag-btn ${currentTag === 'mastered' ? 'active-mastered' : ''}" data-song="${rec.title}" data-tag="mastered">✅ 習得済み</button>
          <button class="tag-btn ${currentTag === 'practicing' ? 'active-practicing' : ''}" data-song="${rec.title}" data-tag="practicing">🎵 練習中</button>
          <button class="tag-btn tag-btn-clear ${currentTag === null ? 'hidden' : ''}" data-song="${rec.title}" data-tag="clear">✕ クリア</button>
        </div>
      `;

      card.innerHTML = `
        <div class="song-info">
          <h3>${rec.title}</h3>
          <div class="song-artist">アーティスト: ${rec.artist}</div>
          ${rec.isUniversal ? '<span class="universal-badge">👥 みんな知ってる</span>' : ''}
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

        ${tagHTML}
      `;

      recommendationsContainer.appendChild(card);
    });

    // タグボタンのイベント
    recommendationsContainer.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const songTitle = btn.dataset.song;
        const tag = btn.dataset.tag;

        if (tag === 'clear') {
          saveTag(songTitle, null);
        } else {
          const currentTag = loadTags()[songTitle];
          // 同じタグを再クリックしたらクリア
          saveTag(songTitle, currentTag === tag ? null : tag);
        }

        // カード内のタグボタンを再描画
        const newTags = loadTags();
        const newTag = newTags[songTitle] || null;
        const group = btn.closest('.tag-btn-group');
        group.querySelectorAll('.tag-btn').forEach(b => {
          if (b.dataset.tag === 'mastered') b.classList.toggle('active-mastered', newTag === 'mastered');
          if (b.dataset.tag === 'practicing') b.classList.toggle('active-practicing', newTag === 'practicing');
          if (b.dataset.tag === 'clear') b.classList.toggle('hidden', newTag === null);
        });
      });
    });

    resultsArea.classList.remove('hidden');
  }

  // --- Matching Engine ---
  function getMockRecommendations(currentState, shuffleMode = false) {
    const songDatabase = window.songDatabase || [];
    const tags = loadTags();
    const isSingMode = currentState.mode === 'sing';

    const scoredSongs = songDatabase.map(song => {
      const songTag = tags[song.title] || null;

      let score = 50;
      // シャッフルモード: スコアにランダムノイズを加えて異なる結果を出す
      if (shuffleMode) {
        score += Math.floor(Math.random() * 50) - 25;
      }

      // singモード: 習得済みでも universalでもない曲は除外
      if (isSingMode) {
        if (songTag !== 'mastered' && !song.universal) {
          return null;
        }
        // 習得済みを優先
        if (songTag === 'mastered') score += 60;
      } else {
        // learnモード: 習得済みは提案から外す
        if (songTag === 'mastered') return null;
        // 練習中はやや優先
        if (songTag === 'practicing') score += 20;
      }

      // 1. 音域マッチ度
      let vocalScore = 0;
      let vocalDiff = Math.abs(song.vocalLevel - currentState.vocalLevel);

      if (currentState.originalKeyOnly) {
        if (vocalDiff === 0) {
          vocalScore = 100;
          score += 45;
        } else {
          return null; // 除外
        }
      } else {
        if (vocalDiff === 0) {
          vocalScore = 95 + Math.floor(Math.random() * 5);
          score += 30;
        } else if (vocalDiff === 1) {
          vocalScore = 80 + Math.floor(Math.random() * 10);
          score += 15;
        } else {
          vocalScore = 60 + Math.floor(Math.random() * 10);
          score -= 10;
        }
      }

      // 2. 得意アーティストマッチ度（習得済みより低い優先度）
      if (currentState.selectedArtists.includes(song.artistKey)) {
        score += 25;
      }

      // 3. ムードマッチ度
      let isMoodMatch = song.moods.includes(currentState.mood);
      if (isMoodMatch) {
        score += 40;
      } else {
        score -= 20;
      }

      // 盛り上がり度
      let hypeBase = 50;
      if (currentState.mood === 'hype') {
        hypeBase = isMoodMatch ? (93 + Math.floor(Math.random() * 6)) : (70 + Math.floor(Math.random() * 10));
      } else if (currentState.mood === 'singalong') {
        hypeBase = isMoodMatch ? (90 + Math.floor(Math.random() * 9)) : (65 + Math.floor(Math.random() * 15));
      } else if (currentState.mood === 'emotional') {
        hypeBase = isMoodMatch ? (55 + Math.floor(Math.random() * 15)) : (40 + Math.floor(Math.random() * 15));
      } else {
        hypeBase = isMoodMatch ? (75 + Math.floor(Math.random() * 10)) : (50 + Math.floor(Math.random() * 15));
      }

      // 4. 同伴メンバーの年代マッチ度
      if (currentState.member === 'boss') {
        if (song.era === 'showa') score += 35;
        else if (song.era === 'heisei') score += 20;
        else if (song.era === 'reiwa') score -= 15;
        if (song.members.includes('boss')) score += 15;
      } else if (currentState.member === 'friends') {
        if (song.era === 'reiwa') score += 35;
        else if (song.era === 'heisei') score += 15;
        else if (song.era === 'showa') score -= 20;
        if (song.members.includes('friends')) score += 15;
      } else if (currentState.member === 'date') {
        if (song.era === 'reiwa') score += 25;
        else if (song.era === 'heisei') score += 25;
        else if (song.era === 'showa') score -= 15;
        if (song.members.includes('date')) score += 15;
      } else if (currentState.member === 'family') {
        if (song.era === 'showa') score += 20;
        else if (song.era === 'heisei') score += 20;
        else if (song.era === 'reiwa') score += 5;
        if (song.members.includes('family')) score += 15;
      }

      // 5. 年代層マッチ度
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
      let comment = '';
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
        score: score,
        isUniversal: !!song.universal
      };
    }).filter(s => s !== null);

    // スコア順にソート
    scoredSongs.sort((a, b) => b.score - a.score);

    // 提案曲数: singモードで習得済みタグあり→3曲、それ以外→6曲
    const masteredCount = Object.values(tags).filter(t => t === 'mastered').length;
    const resultCount = (isSingMode && masteredCount > 0) ? 3 : 6;

    return scoredSongs.slice(0, resultCount);
  }
});
