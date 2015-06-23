
import superagent from 'superagent'
import data from '../data'
import token from './token'

const params = {
  oauth_token: token,
  client_id: data.client_id,
  limit: data.pageSize
}

let TracksFetcher = {

  fetchStream () {
    return new Promise(function(resolve, reject) {
      let endpoint = '/me/activities/tracks'
      function mapStreamTrack (track) {
        let obj = track.origin;
        obj.type = track.type || null;
        obj.posted_at = track.created_at;
        return obj;
      }
      superagent
        .get(data.api + endpoint)
        .query(params)
        .end(function(err, res) {
          if (err) {
            reject(err)
          }
          let response = JSON.parse(res.text)
          let tracks = response.collection.map(mapStreamTrack)
          console.log('future_href', response.future_href)
          resolve(tracks)
        })
    })
  },

  fetchUserTracks (username) {
    return new Promise(function(resolve, reject) {
      let endpoint = '/users/' + username + '/tracks'
      superagent
        .get(data.api + endpoint)
        .query(params)
        .end(function(err, res) {
          if (err) {
            reject(err)
          }
          let tracks = JSON.parse(res.text)
          resolve(tracks)
        })
    })
  }

}

export default TracksFetcher

