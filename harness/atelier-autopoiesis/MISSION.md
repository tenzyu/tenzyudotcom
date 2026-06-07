# Header

オレが解決したい問題意識は、LLM / Coding Agent の性能が上がっても、作業対象であるリポジトリ側に、仕様・判断・検証・権限・履歴・失効状態を機械的に扱える制御構造がなければ、長期開発は安定しないという点にある。

不足しているのは、単なるドキュメント検索や AGENTS.md の整備ではない。repo / vault 内の artifact が、何を根拠に有効で、どの範囲に適用され、何によって検証され、いつ失効し、誰またはどの policy によって正史化されたのかを、LLM と人間の双方が同じ操作対象として扱える状態にすることである。

---

# 1. 表層の問題

現代の agentic development では、リポジトリの中に、仕様書、ADR、タスク、テスト、hooks、lint、checks、prompts、handoffs、レビュー、実装メモ、検証結果、失敗ログ、エージェント用指示、CLI 設定、権限設定などが散在する。

これらはすべて開発を前に進めるための重要な artifact だが、多くの場合は Markdown、設定ファイル、コメント、issue、PR、ログ、チャット履歴として別々に存在している。情報は存在するが、それぞれの artifact がどの状態にあり、どれが正で、どれが古く、どれが未確定で、どれが検証済みなのかを機械的に判定できない。

その結果、LLM は毎回同じ壁に当たる。

何が最新の仕様なのか分からない。どの判断が accepted で、どれが proposed なのか分からない。handoff を読んでも、それが現在の commit、task、review 状態に対してまだ有効なのか分からない。レビュー指摘が解消済みなのか、未解決なのかも曖昧になる。作業対象の範囲、触ってよいファイル、走らせるべき検証、守るべき invariant も文脈依存になる。

この問題は、単に context window を広げたり、RAG を足したり、ドキュメントをきれいにしたりすれば解けるものではない。むしろ、制御されていない情報を増やすほど、LLM は古い仕様、未承認の提案、失効した handoff、未検証の推論を同じ重みで扱いやすくなる。表層の問題は「情報不足」ではなく、「情報はあるが、作業可能な制御状態になっていない」ことである。

---

# 2. 本質の問題

中核問題は、人間と LLM が共有しているはずのプロジェクト文脈が、計算可能な control plane になっていないことにある。

人間は曖昧な artifact 群を見ても、経験と空気で補完できる。「この仕様は古い」「この ADR はまだ有効」「この handoff は一部だけ信じる」「このレビュー指摘は未解決」「この task はまだ実装してはいけない」「この変更には追加テストが必要」といった判断を、明文化されていない優先順位や履歴理解で処理できる。

しかし LLM は、その補完を安定して再現できない。特に長期開発では、仕様、実装、テスト、レビュー、handoff、issue、設計判断が時間差で drift する。LLM はそれらを自然言語として読めても、どれが authority を持つのか、どれが stale なのか、どれが検証済みなのか、どれが単なる推論なのかを安定して区別できない。

その結果、agentic development は人間による文脈再構成に依存し続ける。人間が毎回長文で説明し、LLM が一部を忘れ、別スレッドで handoff が作られ、handoff 同士が矛盾し、レビュー指摘が消え、仕様と実装が drift し、最後は人間が目視で整合を取る。

ここで潰すべき構造は、「LLM がまだ十分に賢くないこと」ではない。むしろ、repo 側が LLM に対して、現在有効な仕様、確定済みの判断、未解決の問題、許可された変更範囲、必要な検証、失効した artifact を返せる形になっていないことが問題である。

したがって、解くべき対象は agent の推論能力ではなく、repo / vault に埋もれている知識・仕様・判断・検証・履歴を、状態、権威、適用範囲、出自、検証関係、失効条件を持つ operational state として外部化することである。

---

# 3. 一言で言うなら

LLM 時代の長期開発で本当に不足しているのは、より賢い coding agent ではなく、agent が継続的に安全に作業するための semantic control plane である。

人間の頭の中にある「このプロジェクトでは何が正で、何が古く、何をしてよくて、何をしてはいけないか」を、repo / vault 内の artifact graph として外部化し、計算可能・検証可能・委譲可能・失効可能にする。

これはドキュメント検索でも、AGENTS.md の高度化でも、単なる知識グラフでもない。仕様、判断、検証、権限、履歴を、agent が作業前・作業中・作業後に問い合わせられる制御層に変えることである。

---

# 4. 解決の方向性

解決の方向性は、repo / vault を「ファイル集合」ではなく、意味単位の artifact graph を持つ executable project memory として扱うことにある。ただし、ここでいう memory は単なる記憶、検索、要約ではない。repo 内の仕様、判断、検証、権限、履歴、失効状態を制御する semantic control layer である。

md、ts、mdx、json、yaml、toml、rs、nix などのファイルは、そのまま LLM に読ませる一次文脈ではなく、まず semantic chunk にコンパイルされる。各 chunk は requirement、decision、invariant、test case、task、review finding、handoff、roadmap item、code symbol、config rule、permission rule、check result などの型を持つ node になる。node は単なる要約ではなく、元ファイル、AST、見出し、行範囲、commit、PR、review、issue、実行ログへの anchor を保持する。つまり、LLM が生成した曖昧な説明ではなく、検証可能な出自を持つ artifact として扱われる。

node には lifecycle がある。observed、derived、inferred、proposed、accepted、verified、superseded、rejected、archived のような状態を持ち、状態遷移は promotion policy によって制御される。特に重要なのは、LLM が抽出・推論した artifact を即座に正史化しないことである。LLM が見つけた仕様は、最初は observed または inferred に過ぎない。accepted になるには、根拠、scope、owner、conflict check、必要に応じた人間の承認が必要になる。verified になるには、test、check、review、明示的 waiver など、検証可能な条件が必要になる。

node 同士は typed graph として接続される。requirement は test に validated_by され、code symbol に implemented_by され、ADR に constrained_by され、review finding に challenged_by され、task に depends_on される。handoff は accepted node を参照し、未確定事項を proposed node として運ぶことはできるが、それ自体が authority にはならない。handoff は transport artifact であり、正史ではない。commit 範囲、task 状態、後続 handoff、supersede 関係によって失効しうる。

この graph は、単なる知識グラフではない。関係を表すだけでは、何を信じるべきかは決まらないため、authority model が必要になる。architecture に関する判断では accepted ADR が強く、behavior contract では accepted spec と verified test が強く、actual behavior では current implementation と実行結果が強く、作業許可では task scope、permission rule、CODEOWNERS 的所有権、risk policy が強くなる。矛盾がある場合、graph はそれを隠さず、conflict として露出させる。

この runtime は artifact 間の変換可能性を持つ。handoff から draft spec や roadmap を生成し、spec から test plan を導出し、test から暗黙仕様を逆抽出し、accepted requirement から ts、rs、md、json、yaml、config などへ materialize する。ただし、materialization は常に state と authority を伴う。LLM の提案を直接ファイルへ反映するのではなく、proposed node として生成し、promotion policy を通過したものだけが accepted artifact として materialize される。

agent は repo 全体を雑に読むのではなく、この semantic runtime に問い合わせる。現在有効な仕様、触ってよい範囲、未解決レビュー、必要な検証、失効した handoff、矛盾する判断、blocked reason、次に推奨される task を query で取得する。agent に渡されるのは長文 context ではなく、task-local control packet である。そこには active requirements、accepted decisions、allowed operations、forbidden operations、required checks、open findings、stale artifacts、evidence anchors が含まれる。

編集も最終的には semantic node 単位で扱われる。agent は単にファイルを変更するのではなく、どの requirement を実装し、どの finding を解消し、どの test で検証し、どの decision に制約されているかを明示した変更 proposal を作る。runtime はその proposal を既存 graph、権限、scope、検証条件、staleness、conflict と照合し、許可された変更だけを各ファイルへ安全に materialize する。

最終形では、人間は文書や handoff の同期を手で維持しない。同期、supersede、staleness detection、drift detection、task recommendation、handoff compression、spec / roadmap transformation、不要 artifact の archive、未検証推論の隔離、矛盾の露出は runtime が担う。人間の役割は、artifact の手入れではなく、authority、promotion policy、例外判断、方針決定、最終承認に移る。

この構想で避けるべき誤りは明確である。文脈を増やすことを解決策にしない。LLM の抽出結果を即座に accepted にしない。graph を作るだけで authority が解決すると考えない。handoff を正史にしない。最初からすべてを双方向 materialization しようとしない。失効した artifact を無造作に削除しない。削除ではなく、superseded、archived、rejected、retracted、invalidated として履歴上の意味を保持する。

つまり目指すべきものは、AGENTS.md やドキュメント検索の延長ではない。LLM が継続的に作業できるように、repo / vault 内の知識・仕様・判断・検証・権限・履歴を、計算可能・変換可能・検証可能・失効可能な semantic control layer に変えることである。

---

# 5. この構想の非目標

この構想は、LLM に読む情報を増やすための仕組みではない。情報量を増やすほど agent が賢くなる、という前提には立たない。むしろ、状態・権威・適用範囲・失効条件のない情報は、長期開発ではノイズや誤作業の原因になる。

この構想は、単なる RAG、ドキュメント検索、AGENTS.md 生成、prompt 管理、開発メモ管理、issue 整理、知識グラフ可視化でもない。それらは必要な部品になりうるが、中核ではない。中核は、agent が作業する前に「何が有効か」「何が未確定か」「何を変更してよいか」「何で検証するか」「何が失効しているか」を機械的に問い合わせられる制御面を repo 側に持たせることである。

また、この構想は LLM の推論を排除するものではない。むしろ LLM の推論を使う。ただし、推論結果をそのまま正史にしない。LLM は artifact を抽出し、関係を提案し、矛盾を検出し、draft を生成する。しかし、それらは lifecycle と promotion policy を通過して初めて accepted または verified になる。

最終的に必要なのは、賢い agent を信頼することではなく、agent が間違えても repo 側の control plane が drift、staleness、scope violation、unverified change、authority conflict を検出できる状態である。
