import http from 'k6/http';
import { Trend } from 'k6/metrics';

const elasticacheProcessingTrend = new Trend('elasticache_processing (milliseconds)');

export const options = {
    vus: 10,
    duration: '30s',
};

export default function () {
    const response = http.post('https://invz7o8dud.execute-api.us-east-1.amazonaws.com/prod/charge-request-redis');
    const responseBody = JSON.parse(response.body)
    elasticacheProcessingTrend.add(responseBody.ms);
}