export const fetchFeeds = async () => {
  // Simulate fetching data from an API
  return [
    {
      id: "1",
      username: "Anonymous",
      content: "Sample feed content",
      createdAt: "Just now",
      type: "text",
      likes: 10,
      comments: [],
    },
    {
      id: "2",
      username: "Anonymous",
      content: "Sometimes I feel like I'm not good enough...",
      createdAt: "2 mins ago",
      type: "text" as const,
      likes: 234,
      comments: [
        {
          id: "c1",
          username: "Anonymous",
          content: "Stay strong! We're all in this together.",
          createdAt: "1 min ago",
          likes: 5,
          replies: [
            {
              id: "r1",
              username: "Anonymous",
              content: "Thank you for the kind words! 🙏",
              createdAt: "30s ago",
              likes: 2,
              replies: [],
            },
          ],
        },
        {
          id: "c2",
          username: "Anonymous",
          content:
            "I've been there. It gets better with time. Focus on small wins and celebrate them.",
          createdAt: "2 min ago",
          likes: 8,
          replies: [],
        },
        {
          id: "c3",
          username: "Anonymous",
          content:
            "Remember that your worth isn't measured by your productivity or achievements.",
          createdAt: "3 min ago",
          likes: 12,
          replies: [],
        },
        {
          id: "c4",
          username: "Anonymous",
          content: "Sending virtual hugs 🫂",
          createdAt: "4 min ago",
          likes: 7,
          replies: [],
        },
        {
          id: "c5",
          username: "Anonymous",
          content:
            "Take it one day at a time. You're doing better than you think.",
          createdAt: "5 min ago",
          likes: 15,
          replies: [],
        },
      ],
    },
    {
      id: "3",
      username: "Anonymous",
      content: "Found this beautiful spot today...",
      createdAt: "15 mins ago",
      type: "image" as const,
      imageUrl:
        "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&auto=format&fit=crop",
      likes: 856,
      comments: [],
    },
    {
      id: "4",
      username: "Anonymous",
      content:
        "Just needed to get this off my chest: University is overwhelming and it's okay to take breaks. Mental health comes first. 🧠❤️",
      createdAt: "1 hour ago",
      type: "text" as const,
      likes: 1431,
      comments: [],
    },
    // Add more mock data as needed
  ];
};
