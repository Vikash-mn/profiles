// Lightweight native helpers for the terminal AI fast path.
// Build: g++ -std=c++17 -O3 -shared -fPIC neural_boost.cpp -o neural_boost.so
// Windows: g++ -std=c++17 -O3 -shared -static -static-libgcc -static-libstdc++ neural_boost.cpp -o neural_boost.dll

#include <cctype>
#include <cstring>
#include <string>
#include <vector>
#include <unordered_set>
#include <algorithm>

#if defined(_WIN32)
#define BOOST_EXPORT __declspec(dllexport)
#else
#define BOOST_EXPORT
#endif

static std::vector<std::string> tokenize(const std::string& input) {
    std::vector<std::string> tokens;
    std::string current;
    current.reserve(input.size());

    for (char c : input) {
        if (std::isalnum(static_cast<unsigned char>(c))) {
            current.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(c))));
        } else if (!current.empty()) {
            tokens.push_back(current);
            current.clear();
        }
    }
    if (!current.empty()) {
        tokens.push_back(current);
    }
    return tokens;
}

static double jaccard(const std::vector<std::string>& a, const std::vector<std::string>& b) {
    if (a.empty() || b.empty()) return 0.0;

    std::unordered_set<std::string> setA(a.begin(), a.end());
    std::unordered_set<std::string> setB(b.begin(), b.end());

    size_t intersection = 0;
    for (const auto& token : setA) {
        if (setB.find(token) != setB.end()) {
            intersection++;
        }
    }

    const size_t unionCount = setA.size() + setB.size() - intersection;
    if (unionCount == 0) return 0.0;
    return static_cast<double>(intersection) / static_cast<double>(unionCount);
}

static double char_overlap(const std::string& a, const std::string& b) {
    if (a.empty() || b.empty()) return 0.0;
    size_t matches = 0;
    size_t limit = std::min(a.size(), b.size());

    for (size_t i = 0; i < limit; ++i) {
        if (std::tolower(static_cast<unsigned char>(a[i])) ==
            std::tolower(static_cast<unsigned char>(b[i]))) {
            matches++;
        }
    }
    return static_cast<double>(matches) / static_cast<double>(limit);
}

extern "C" BOOST_EXPORT double hybrid_score(const char* a, const char* b) {
    if (!a || !b) return 0.0;
    std::string sa(a);
    std::string sb(b);

    const auto tokensA = tokenize(sa);
    const auto tokensB = tokenize(sb);

    const double j = jaccard(tokensA, tokensB);
    const double o = char_overlap(sa, sb);

    // Weighted blend keeps scoring fast and stable.
    return (0.65 * j) + (0.35 * o);
}
