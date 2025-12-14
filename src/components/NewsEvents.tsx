import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface NewsEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  image_url: string | null;
  read_more_link: string | null;
}

const NewsEvents = () => {
  const [news, setNews] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchNewsEvents();
  }, []);

  const fetchNewsEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('news_events')
        .select('id, title, description, date, image_url, read_more_link')
        .eq('is_active', true)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6); // Limit to 6 items for display

      if (error) throw error;

      if (data && data.length > 0) {
        setNews(data);
      }
    } catch (error) {
      console.error('Error fetching news/events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const truncateDescription = (text: string, maxLength: number = 52) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handleReadMore = (item: NewsEvent) => {
    setSelectedNews(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNews(null);
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8 md:px-12 lg:px-16">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading news and events...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8 md:px-12 lg:px-16">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-[38px] font-[700] text-[#333333] mb-5">
                Latest News & Events
              </h2>
              <p className="text-[18px] font-[400] text-[#333333] leading-relaxed">
                Learn from dedicated mentors who are experts in their fields and passionate about your<span className="hidden lg:inline"><br /></span> spiritual and academic growth.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#15133D] text-[12px] font-medium text-[#ffffff]">
              View All <ChevronRightIcon style={{ color: "#ffffff" }} />
            </button>
          </div>

          {news.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No news or events available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {news.map((item) => (
                <article
                  key={item.id}
                  className="bg-white rounded-[12px] shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-[15px]">
                    <div className="aspect-video overflow-hidden rounded-[12px]">
                      <img
                        src={item.image_url || "/images/Events.png"}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 rounded-[12px]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/Events.png";
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-[18px] font-semibold text-[#1A2633] mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-bible-gold font-medium mb-3">{formatDate(item.date)}</p>
                    <p className="text-[14px] font-normal text-[#333333] mb-4">
                      {truncateDescription(item.description, 52)}
                    </p>
                    <button
                      onClick={() => handleReadMore(item)}
                      className="text-bible-blue font-medium hover:text-bible-purple transition-colors duration-200 cursor-pointer"
                    >
                      Read More
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Read More Modal */}
      {showModal && selectedNews && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#1A2633] mb-2">
                  {selectedNews.title}
                </h3>
                <p className="text-bible-gold font-medium">
                  {formatDate(selectedNews.date)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {selectedNews.image_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={selectedNews.image_url}
                    alt={selectedNews.title}
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="prose max-w-none">
                <p className="text-[16px] font-normal text-[#333333] leading-relaxed whitespace-pre-wrap">
                  {selectedNews.description}
                </p>
              </div>
              {selectedNews.read_more_link && (
                <div className="mt-6">
                  <a
                    href={selectedNews.read_more_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#15133D] text-white rounded-lg hover:bg-[#1a1650] transition-colors font-medium"
                  >
                    Learn More
                    <ChevronRightIcon style={{ color: "#ffffff" }} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsEvents;
