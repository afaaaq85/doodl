import { useEffect, useRef } from "react";


interface Comments {
    name: string;
    comment: string;
  }

const Comments = ({commentsData}: {commentsData: Comments[]}) => {
  const commentsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, [commentsData]);


  return (
    <div className="w-full">
      <p className="font-bold bg-black text-white p-2 rounded-t-md text-center py-4">Comments</p>
      <ul ref={commentsRef} className="flex flex-col gap-0 mt-2 max-h-[390px] overflow-y-scroll ps-2">
        {commentsData.map((comment, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="font-bold">{comment.name}:</span>
            <span>{comment.comment}</span>
          </li>
        ))}
        
      </ul>
    </div>
  );
};

export default Comments;
