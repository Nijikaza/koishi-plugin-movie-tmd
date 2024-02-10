import { Context, Schema } from 'koishi';
import axios from 'axios';

/// 支持的语言列表
const supportedLanguages = [
  'en-US', // 英语（美国）
  'zh-CN', // 简体中文
  'es-ES', // 西班牙语（西班牙）
  'fr-FR', // 法语（法国）
  'de-DE', // 德语（德国）
  'it-IT', // 意大利语（意大利）
  'ja-JP', // 日语（日本）
  'ko-KR', // 韩语（韩国）
  'ru-RU', // 俄语（俄罗斯）
  'pt-BR', // 葡萄牙语（巴西）
  'pt-PT', // 葡萄牙语（葡萄牙）
  'nl-NL', // 荷兰语（荷兰）
  'sv-SE', // 瑞典语（瑞典）
  'da-DK', // 丹麦语（丹麦）
  'fi-FI', // 芬兰语（芬兰）
  'pl-PL', // 波兰语（波兰）
  // 在此添加更多支持的语言
];

// 插件配置接口
interface Config {
  apiKey: string; // TMDB API密钥
  language?: string; // 默认语言
  imageBaseURL?: string; // 图片基础URL
}

export const Config: Schema<Config> = Schema.object({
  apiKey: Schema.string().description('TMDB API密钥').required(),
  language: Schema.union(supportedLanguages.map(lang => Schema.const(lang)).concat(Schema.string().default('zh-CN'))).description('语言设置'),
  imageBaseURL: Schema.string().default('https://image.tmdb.org/t/p/w500').description('图片基本URL'),
});

const DEFAULT_CONFIG: Config = {
  apiKey: '',
  language: 'zh-CN',
  imageBaseURL: 'https://image.tmdb.org/t/p/w500', // 默认的图片URL路径为宽度500px的图片
};
export const usage = `
使用TMDB API以提供对于某部影片某个人物的搜索（？）
获取apiKey的方法
<br>
<a href="https://www.npmjs.com/package/koishi-plugin-movie-tmd">    
    <img src="https://images.dmzj.com/resource/news/2022/12/15/1671089076233184.gif" height = 400 width = 400 alt="readme">
</a>
<a href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=kW4Mvn1XZsfR_ghZfzdMK0-RlqvSlAFG&authKey=i%2ByfvnYw2qw9Y98RegxyacrannA8z9MEXQ9fICWZb%2FxCxN8atmjox399OWN%2BwR5%2F&noverify=0&group_code=778554862">
    <img src="https://image.newasp.com/attachment/article/2022/1204/093738_49079822.gif" alt="加入QQ群">
</a>
`
// 注册插件
export const name = 'movie-tmd';
export function apply(ctx: Context, config: Config = DEFAULT_CONFIG) {
  ctx.command('tmdb <query>', '搜索电影')
    .action(async (_, query) => {
      if (!query) return '请输入搜索关键词。';
      if (!config.apiKey) return '未配置TMDB API密钥。';

      try {
        // 发送请求到TMDB API搜索电影
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: {
            api_key: config.apiKey,
            query,
            language: config.language,
          },
        });

        // 检查是否有结果
        const { results } = response.data;
        if (results.length === 0) {
          return '没有找到电影。';
        }

        // 格式化搜索结果
        const movies = results.map((movie: any) => {
          const movieInfo = `电影名：${movie.title}\n` +
                            `简介：${movie.overview}\n` +
                            `评分：${movie.vote_average}\n` +
                            `上映日期：${movie.release_date}\n` +
                            `更多信息：https://www.themoviedb.org/movie/${movie.id}`;

          // 检查是否有可用的图片路径
          const imageUrl = movie.poster_path
            ? `${config.imageBaseURL}${movie.poster_path}`
            : '图片不可用';
          
          // 返回格式化后的电影信息和图片URL
          return imageUrl !== '图片不可用'
            ? { type: 'image', url: imageUrl }
            : movieInfo;
        });

        // 回复消息给用户，发送图片和电影信息
        return movies.flat().join('\n\n');
      } catch (error) {
        console.error('搜索电影时发生错误:', error);

        let errorMessage = '无法完成搜索，发生了一个错误。';
        if (error.response) {
          errorMessage += `服务器返回了状态码：${error.response.status}。`;
        } else if (error.request) {
          errorMessage += '没有收到服务器的响应，可能是网络连接问题。';
        } else {
          errorMessage += '请求无法发送，可能是配置有误或者代码存在错误。';
        }
        if (error.code) {
          errorMessage += ` 错误码：${error.code}。`;
        }

        return errorMessage;
      }
    });
}