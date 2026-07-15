/** 공공데이터 기반 관광지 정보 */
/**
 * @typedef {'자연/공원'|'역사/문화'|'전시/미술'|'거리/골목'|'시장/쇼핑'|'체험/액티비티'} PlaceCategory
 */

/**
 * @typedef {Object} Place
 * @property {number} id
 * @property {string} name
 * @property {PlaceCategory} category
 * @property {string} district
 * @property {string} neighborhood
 * @property {string} address
 * @property {string} description
 * @property {string} hours
 * @property {string} fee
 * @property {string} emoji
 * @property {[string,string]} gradient
 */

/** 지역 주민 TIP */
/**
 * @typedef {Object} LocalTip
 * @property {number} id
 * @property {number} placeId
 * @property {string} author
 * @property {number} residentYears
 * @property {string} content
 * @property {number} likes
 */

/** 커뮤니티 게시글 */
/**
 * @typedef {Object} Post
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {number|null} placeId
 * @property {string[]} tags
 * @property {string} author
 * @property {boolean} isLocal
 * @property {string} password
 * @property {string} createdAt
 * @property {number} views
 * @property {number} likes
 */

/** 챗봇 메시지 */
/**
 * @typedef {Object} ChatMessage
 * @property {number} id
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

export {}
