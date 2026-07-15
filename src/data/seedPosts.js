function daysAgo(n){ return new Date(Date.now() - n*86400000).toISOString() }

const posts = [
  { id:1001, title:'경복궁 야간개장 후기 - 사진 꿀팁 공유', content:'경복궁 야간개장 다녀왔어요. 조명이 정말 예쁘더라구요. 한적한 시간대 팁도 있어요. 카메라 삼각대는 필수입니다.', password:'1234', createdAt: daysAgo(1), views: 270, likes: 18 },
  { id:1002, title:'북촌한옥마을 산책 코스 추천', content:'주말에 북촌 한옥마을 돌았는데 골목길이 정말 좋아요. 경치 좋은 카페도 하나 발견했어요. 동네 산책하듯 걷기 좋아요.', password:'1234', createdAt: daysAgo(3), views: 85, likes: 6 },
  { id:1003, title:'서울숲에서 반려견 놀아주실 분?', content:'서울숲 근처 사는 지역 주민 3년차인데, 주말에 같이 산책하실 분 계실까요? 애견 동행 환영합니다.', password:'1234', createdAt: daysAgo(5), views: 42, likes: 2 },
  { id:1004, title:'남산서울타워 야경 질문', content:'남산타워 전망대 예약 관련해서 질문 있어요. 야경 보러 가는데 좋은 시간대 추천 부탁드립니다.', password:'1234', createdAt: daysAgo(2), views: 60, likes: 4 },
  { id:1005, title:'광장시장 먹거리 추천', content:'광장시장 떡볶이랑 빈대떡 꼭 드셔보세요. 특히 야채빈대떡이 아주 맛있습니다. 시장 골목 사이 골목 맛집 소개합니다.', password:'1234', createdAt: daysAgo(7), views: 150, likes: 12 },
  { id:1006, title:'창덕궁 후원 예약 꿀팁', content:'창덕궁 후원은 예약이 필수예요. 평일 오전 시간을 노리면 한적하고 좋습니다. 지역 주민 팁으로 입장 줄이 짧아요.', password:'1234', createdAt: daysAgo(10), views: 32, likes: 1 },
  { id:1007, title:'동대문디자인플라자(DDP) 전시 같이 보실 분', content:'이번 주말 DDP에서 전시 보려고 합니다. 관심 있으신 분 같이 가요. 1~2시간 정도 편하게 보실 분 모집합니다.', password:'1234', createdAt: daysAgo(4), views: 95, likes: 8 },
  { id:1008, title:'청계천 새벽 조깅 루트 공유', content:'청계천 새벽 러닝 코스 좋아요. 조용하고 공기도 괜찮습니다. 지역 주민 n년차인데 강추합니다.', password:'1234', createdAt: daysAgo(12), views: 28, likes: 0 },
  { id:1009, title:'광장시장 야시장 분위기 후기', content:'어제 광장시장 갔다 왔는데 사람 진짜 많네요. 그래도 먹거리는 훌륭했습니다. 친구들이랑 떠들며 다니기 좋아요.', password:'1234', createdAt: daysAgo(6), views: 310, likes: 20 },
  { id:1010, title:'북촌한옥마을 골목 사진 포인트', content:'북촌에 사진 찍기 좋은 포인트 정리했어요. 낮보단 해질녘 추천합니다. 삼청동 쪽으로 이어지는 길이 특히 예뻐요.', password:'1234', createdAt: daysAgo(9), views: 48, likes: 3 },
  { id:1011, title:'경복궁 근처 맛집 질문', content:'경복궁 가는 길에 점심 먹을만한 곳 있을까요? 동네 주민 n년차로서 몇 군데 추천해 드립니다.', password:'1234', createdAt: daysAgo(11), views: 22, likes: 0 },
  { id:1012, title:'서울숲 플리마켓 꿀팁 공유', content:'주말 플리마켓에서 좋은 소품 득템했습니다. 이른 시간에 가면 주차도 편하고 사람도 적어요.', password:'1234', createdAt: daysAgo(14), views: 18, likes: 1 }
]

export default posts
