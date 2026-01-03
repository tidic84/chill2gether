const { normalizeYouTubeInput } = require('./YouTubeSearch');

describe('normalizeYouTubeInput', () => {
  test('devrait retourner la même recherche si ce n’est pas une URL', () => {
    expect(normalizeYouTubeInput('chat mignon')).toBe('chat mignon');
  });

  test('devrait transformer un lien youtu.be en lien youtube.com', () => {
    expect(normalizeYouTubeInput('https://youtu.be/UtURuMp7E44?si=4Uev1jwiIWcL9dfL'))
      .toBe('https://www.youtube.com/watch?v=UtURuMp7E44');
  });

  test('devrait transformer un lien youtube.com avec paramètres en lien standard', () => {
    expect(normalizeYouTubeInput('https://www.youtube.com/watch?v=Di3FQDJlQcA&ab_channel=Test'))
      .toBe('https://www.youtube.com/watch?v=Di3FQDJlQcA');
  });

  test('devrait retourner l’input si l’URL est mal formée', () => {
    expect(normalizeYouTubeInput('https://notyoutube.com/watch?v=123')).toBe('https://notyoutube.com/watch?v=123');
  });
});
